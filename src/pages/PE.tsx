import { useState } from 'react';
import '../styles/pe.css';
import { useEffect } from 'react';
import { useI18n } from '../contexts/I18nProvider';
import PeData from '../assets/progression.json'
import moment from 'moment';

export default function PE() {
  const { t } = useI18n()

  let stPath = 'https://storage.googleapis.com/rc-calculator-d20ac.firebasestorage.app/'

  const [calcConfig, setCalcConfig] = useState({
    multiplier: 1,
    discount: 0,
    buy: 0,
    buyFinal: 0,
    boxes: 1.45
  });

  const [rentabilityScore, setRentabilityScore] = useState(0);
  const [recomendedMultiplier, setRecomendedMultiplier] = useState([]);


  let boxesPrices = [1.45, 3.45, 8.95, 22.95]
  let discounts = [0,10,15,20,25,30,35,40,45,50]
  let maxMultiplier = PeData.event.event.max_multiplier / 100
  let mult = []
  for (let i = 1; i <= maxMultiplier; i++) {
    mult.push(i)
  }
  const [multipliers, setmultipliers] = useState(mult);
  let recomended: number[] = []
  let taskPoints = {
    boxes: (PeData.tasks.find(t => t.type == 'spend_rlt'))?.xp_reward || 1000,
    marketplace: (PeData.tasks.find(t => t.type == 'marketplace'))?.xp_reward || 1000
  }

  function isRecomended(multiplier: number) {
    return recomendedMultiplier.includes(multiplier)
  }
  
  function getScoreColorClass() {
    if (rentabilityScore == 10) return 'text-accent'
    if (rentabilityScore >= 7) return 'text-success'
    if (rentabilityScore >= 4) return 'text-warning'
    return 'text-danger'
  }

  function calcRecomend() {
    let phXRLT = 1.2 // precio por rlt pensando que tambien se gastara usd (+1 = 2.2)
    let feeXBox = 0.15 // lo que se espera perder en RLT por cada caja abierta
    let rewardsXRLT = 0
    for (let reward of PeData.event.rewards) {
      switch (reward.type) {
        case 'money': 
          switch (reward.currency) {
            case 'RLT': rewardsXRLT += reward.amount / 1e6; break;
            case 'RST': rewardsXRLT += reward.amount / 1e8; break;
          }
          continue;
        case 'power': rewardsXRLT += (reward.amount / 1e6) * phXRLT; continue;
        case 'miner': rewardsXRLT += (reward.item.power / 1e6) * phXRLT; continue;
      }
    }

    let maxBoxesToOpen = Math.ceil(rewardsXRLT / feeXBox)

    // buscamos los dos multiplicadores más cercanos: uno que deje boxesToOpen por debajo (o igual)
    // y otro por encima (o igual) de maxBoxesToOpen
    let closestAbove: { m: number | null; diff: number } = { m: null, diff: Infinity };
    let closestBelow: { m: number | null; diff: number } = { m: null, diff: Infinity };

    for (let m of multipliers) {
      let boxesToOpen = Math.ceil(
      PeData.event.event.max_xp / ((taskPoints.boxes * boxesPrices[0]) * m)
      );
      let diff = boxesToOpen - maxBoxesToOpen;

      if (diff >= 0 && diff < closestAbove.diff) {
      closestAbove = { m, diff };
      }

      if (diff <= 0 && Math.abs(diff) < closestBelow.diff) {
        closestBelow = { m, diff: Math.abs(diff) };
      }
    }

    if (closestAbove.m !== null && closestAbove.m !== closestBelow.m) recomended.push(closestAbove.m);
    if (closestBelow.m !== null) recomended.push(closestBelow.m);

    // seteamos el multiplicador recomendado
    let multiplier = recomended[0] || 1
    let buy = ((multiplier - 1) / PeData.multiplier) | 0
    let buyFinal = parseFloat((buy - (buy * (calcConfig.discount / 100))).toFixed(2)) | 0
    // calcConfig.multiplier = multiplier
    // calcConfig.buy = buy
    // calcConfig.buyFinal = buyFinal
    setCalcConfig(prev => ({
      ...prev,
      buy,
      buyFinal,
      multiplier
    }));

    setRecomendedMultiplier(recomended)


    // calculamos la puntuacion de rentabilidad`
    let usdXRLT = buyFinal / rewardsXRLT
    if (usdXRLT < 0.25) setRentabilityScore(10)
    else if (usdXRLT >= 0.25 && usdXRLT < 0.3) setRentabilityScore(9)
    else if (usdXRLT >= 0.3 && usdXRLT < 0.4) setRentabilityScore(8)
    else if (usdXRLT >= 0.4 && usdXRLT < 0.5) setRentabilityScore(7)
    else if (usdXRLT >= 0.5 && usdXRLT < 0.6) setRentabilityScore(6)
    else if (usdXRLT >= 0.6 && usdXRLT < 0.7) setRentabilityScore(5)
    else if (usdXRLT >= 0.7 && usdXRLT < 0.8) setRentabilityScore(4)
    else if (usdXRLT >= 0.8 && usdXRLT < 0.9) setRentabilityScore(3)
    else if (usdXRLT >= 0.9 && usdXRLT < 1) setRentabilityScore(2)
    else if (usdXRLT >= 1 && usdXRLT < 1.1) setRentabilityScore(1)
    else setRentabilityScore(0)

    // console.log('usdXRLT', usdXRLT)
    // console.log('rewardsXRLT', rewardsXRLT)
    // console.log('maxBoxesToOpen', maxBoxesToOpen)
    // console.log('recomended', recomended)
    // console.log('buyFinal', buyFinal)
  }

  useEffect(() => {
    calcRecomend();
  }, []); 

  function handleCalc(param: string, value: any) {
    let buy = calcConfig.buy
    let buyFinal = calcConfig.buyFinal
    let multiplier = calcConfig.multiplier

    if (param == 'discount') {
      buyFinal = parseFloat((buy - (buy * (value /100))).toFixed(2))
    }
  
    if (param == 'buy') {
      buyFinal = value - (value * (calcConfig.discount/100))
      multiplier = parseFloat(((value * PeData.multiplier) + 1).toFixed(1))
    }

    if (param == 'multiplier' || multiplier != calcConfig.multiplier) {
      if (multiplier > 100) multiplier = 100
      let newMult = multipliers.filter(m => Number.isInteger(m))
      if (!multipliers.some((m: any) => m == multiplier)) {
        newMult.unshift(multiplier)
      }
      setmultipliers(newMult)

      if (param == 'multiplier') {
        buy = (value - 1) / PeData.multiplier
        buyFinal = parseFloat((buy - (buy * (calcConfig.discount / 100))).toFixed(2))
      }
    }
    setCalcConfig(prev => ({
      ...prev,
      buy,
      buyFinal,
      multiplier,
      [param]: value
    }));
  }

  function getRewardBoxes(required_xp: number) {
    return Math.ceil(required_xp / ((taskPoints.boxes * calcConfig.boxes) * calcConfig.multiplier))
  }

  function getRewardMarket(required_xp: number) {
    return Math.ceil(required_xp / (taskPoints.marketplace * calcConfig.multiplier))
  }

  let getRewardImage = (reward: any) => {
    let filename = ''
    switch (reward.type) {
      case 'money': filename = `others/reward_${reward.currency.toLowerCase()}.png`; break;
      case 'season_pass_xp': filename = 'others/season_pass_xp.png'; break;
      case 'power': filename = 'others/reward_power.png'; break;
      case 'utility_item': filename = `others/${reward.item_id}.gif`; break;
      case 'loot_box': filename = `box/${reward.item_id}.png`; break;
      case 'rack': filename = `rack/${reward.item_id}.png`; break;
      case 'miner': filename = `miner/${reward.item.filename}.gif`; break;
    }

    return stPath + filename
  }

  let getRewardValue = (reward: any) => {
    let coinFormatter = new Intl.NumberFormat('De');
    switch (reward.type) {
      case 'money': return `${reward.amount / 1e6} ${reward.currency}`;
      case 'power': return `${coinFormatter.format(reward.amount)} Gh/s`
      case 'miner': return `${coinFormatter.format(reward.item.power)} Gh/s`;
    }
    return reward.amount;
  }

  function getRewardName(reward: any) {
    switch (reward.type) {
      case 'money': return getRewardValue(reward);
      case 'season_pass_xp': return getRewardValue(reward) + ' XP';
      case 'power': return getRewardValue(reward);
      case 'utility_item': return (reward.amount > 1 ? reward.amount : '') + ' ' + reward.item.name.en;
      case 'loot_box': return reward.item.title.en;
      case 'rack':
      case 'miner': return reward.item.name.en;
    }
  }

  function getRewardSubname(reward: any) {
    switch (reward.type) {
      case 'rack': return reward.item.bonus ? (reward.item.bonus / 100) + '%' : ''
      case 'miner': return `${getRewardValue(reward)} ${reward.item.bonus ? '| ' + (reward.item.bonus / 100) + '%' : ''}`;
    }
    return ''
  }

  return (
    <div className='progression-container'>
        <div className='progression-info'>
          <div className='event-title'>{PeData.event.event.title.en}</div>
          <div className='event-subtitle'>{t.pe?.progression_event}</div>
          <div className="rentability-score">
            <div className={'score ' + getScoreColorClass()}>{rentabilityScore}</div>
            <div className="">/10</div>
          </div>
          <div className="rentability-score-text">{t.pe?.rentability_punctuation}</div>
          <div className='deadline'>
            {t.pe?.ends_on} {moment(PeData.event.event.end_date).format('DD/MM/YYYY')} 15:00 UTC
          </div>
          {/* <div className='deadline ended'>
            {t.pe?.the_event_ended}
          </div> */}
          <table className="tasks">
            <tbody>
              <tr className='task-info'>
                <td className="task-name">{t.pe?.multiplier}</td>
                <td className="task-description">x{PeData.multiplier} {t.pe?.per} 1 RLT</td>
              </tr>
              {PeData.tasks.map(task => (
                <tr className='task-info'>
                  <td className="task-name">{t.pe?.[task.type]}</td>
                  <td className="task-description">{task.xp_reward}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className='progression-details'>
          <div className="calculator">
            <div className='calc-input-area'>
              <div className="calc-info">
                <label className='multiplier-info'>{t.pe?.recomended_multiplier}</label>
                <label className='edit-info' htmlFor='buy'>{t.pe?.editable_field}</label>
              </div>
              <div className="calc-table">
                <table>
                  <thead>
                    <th>MULT</th>
                    <th>{t.pe?.discount}</th>
                    <th>{t.pe?.rlt_to_buy}</th>
                    <th>{t.pe?.rlt_with_discount}</th>
                    <th>{t.pe?.boxes}</th>
                  </thead>
                  <tbody>
                    <td>
                      <select 
                        className={isRecomended(calcConfig.multiplier) ? 'calc-input recomended' : 'calc-input' }
                        id='multiplier' 
                        value={calcConfig.multiplier}
                        onChange={e => handleCalc('multiplier', Number(e.target.value))}
                      >
                        {multipliers.map((m: any) => (
                          <option className={isRecomended(m) ? 'recomended': ''} value={m}>x{m}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select 
                        className='calc-input' 
                        id='discount' 
                        value={calcConfig.discount}
                        onChange={e => handleCalc('discount', Number(e.target.value))}
                      >
                        {discounts.map(d => (
                          <option value={d}>{d}%</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input 
                        className='calc-input' 
                        type="number" 
                        id='buy' 
                        name='buy' 
                        value={calcConfig.buy} 
                        onChange={e => handleCalc('buy', Number(e.target.value))}
                      />
                    </td>
                    <td><input className='calc-input' type="number" value={calcConfig.buyFinal} id='buyFinal' disabled/></td>
                    <td>
                      <select 
                        className='calc-input' 
                        id='boxes' 
                        value={calcConfig.boxes}
                        onChange={e => handleCalc('boxes', Number(e.target.value))}
                      >
                        {boxesPrices.map(b => (
                          <option value={b}>{b} RLT</option>
                        ))}
                      </select>
                    </td>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
          <div className="rewards">
            <table className='rewards-table'>
              <thead>
                <th>LVL</th>
                <th>TOTAL</th>
                <th>{t.pe?.points}</th>
                <th>{t.pe?.reward}</th>
                <th></th>
                {/* <th>X</th> */}
                <th>{t.pe?.boxes}</th>
                <th>MARKET</th>
              </thead>
              <tbody>
                {PeData.event.rewards.map((reward, idx) => (
                  <tr>
                    <td>{idx + 1}</td>
                    <td>{PeData.event.levels_config[idx].required_xp}</td>
                    <td>{PeData.event.levels_config[idx].level_xp}</td>
                    <td className='reward-name'>
                      {getRewardName(reward)}
                      <br/>
                      <span className='reward-subname'>{getRewardSubname(reward)}</span>
                    </td>
                    <td className='reward-image-cell' style={{ backgroundImage: `url(${getRewardImage(reward)})` }}>
                      {(reward.item?.level > 0) && 
                        <img src={stPath + `others/level_${reward.item.level + 1}.png`} className='level-image' />
                      }
                    </td>
                    {/* <td className='reward-multiplier'>x{calcConfig.multiplier}</td> */}
                    <td className='reward-boxes'>{getRewardBoxes(PeData.event.levels_config[idx].required_xp)} {t.pe?.boxes}</td>
                    <td className='reward-marketplace'>{getRewardMarket(PeData.event.levels_config[idx].required_xp)} RLT</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  )
}
