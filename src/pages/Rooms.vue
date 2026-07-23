<template>
  <div class="rooms-page">
    <!-- Loading overlay -->
    <div v-if="loading" class="rooms-loading-overlay">
      <img src="../assets/duck.gif" alt="Loading" class="loading-duck" />
    </div>
    <!-- ========== LEFT PANEL - IMPORT ========== -->
    <div class="rooms-import">
      <h1 class="event-title">{{ t.rooms?.title }}</h1>

      <div class="rooms-beta-notice" v-html="t.rooms?.beta_notice"></div>

      <div class="rooms-examples-label">{{ t.rooms?.examples || 'Examples:' }}</div>
      <div class="rooms-examples-row">
        <div class="rooms-example-thumb" @click="previewImage = exampleImages.collection">
          <img :src="exampleImages.collection" alt="Collection" />
          <span>Collection</span>
        </div>
        <div class="rooms-example-thumb" @click="previewImage = exampleImages.inventory">
          <img :src="exampleImages.inventory" alt="Inventory" />
          <span>Inventory</span>
        </div>
        <div class="rooms-example-thumb" @click="previewImage = exampleImages.sell">
          <img :src="exampleImages.sell" alt="Sell" />
          <span>Sell</span>
        </div>
      </div>

      <textarea
        v-model="importText"
        class="rooms-textarea"
        placeholder="Paste data here..."
      ></textarea>

      <button class="rooms-btn-add rooms-btn-full" @click="addMiners">{{ t.rooms?.add }}</button>
      <button class="rooms-btn-auto-import" @click="showAutoImport = 'select'">{{ t.rooms?.auto_import || 'AUTO IMPORT ROOMS' }}</button>

      <div class="rooms-import-buttons">
        <button class="rooms-btn-clear-rooms" @click="showClearRoomsConfirm = true">{{ t.rooms?.clear_rooms }}</button>
        <button class="rooms-btn-clear" @click="showClearConfirm = true">{{ t.rooms?.clear_all }}</button>
      </div>

      <!-- Racks Power -->
      <div v-if="rackBonusExtra > 0" class="rooms-racks-power">
        <div class="rooms-racks-power-title">
          <span class="rooms-racks-power-help">
            <img src="../assets/icons/info.svg" alt="info" class="rooms-info-icon" />
            <span class="rooms-racks-power-tooltip">{{ t.rooms?.racks_power_tooltip || 'Total extra power contributed by racks with bonus applied to the miners inside them.' }}</span>
          </span>
          {{ t.rooms?.racks_power || 'Racks Power' }}
        </div>
        <div class="rooms-racks-power-value">+{{ formatPower(rackBonusExtra) }}</div>
      </div>

      <!-- Active Sets -->
      <div v-if="activeSets.length > 0" class="rooms-active-sets">
        <div class="rooms-active-sets-title">{{ t.rooms?.active_sets }}</div>
        <div
          v-for="set in activeSets"
          :key="set.name"
          class="rooms-set-item"
        >
          <img :src="getAssetUrl('others/set.png')" alt="set" class="rooms-set-badge" />
          <div class="rooms-set-info">
            <span class="rooms-set-name">{{ set.name }} <span
              v-if="set.bonuses.some(b => b.type === 'power')"
              class="rooms-set-power-info"
              @mouseenter="showSetTooltip($event)"
              @mouseleave="hideSetTooltip"
            ><img src="../assets/icons/info.svg" alt="info" class="rooms-info-icon" /></span></span>
            <div class="rooms-set-bonuses">
              <span
                v-for="(bonus, idx) in set.bonuses"
                :key="idx"
                :class="['rooms-set-bonus-tag', bonus.type]"
              >
                {{ bonus.type === 'bonus' ? '+' + bonus.value + '%' : '+' + formatPower(bonus.value) }}
              </span>
            </div>
          </div>
          <span class="rooms-set-level">Lv{{ set.level }}</span>
        </div>
      </div>
    </div>

    <!-- ========== CENTER PANEL ========== -->
    <div class="rooms-center" ref="centerPanel">
      <!-- Top section: description + simulation area side by side -->
      <div class="rooms-top-section">
        <div class="rooms-description-box">
          <p class="rooms-description" v-html="t.rooms?.description"></p>
          <div v-if="!hiddenTips.temp_power" class="rooms-desc-warning">
            <span v-html="t.rooms?.warning_temp_power"></span>
            <span class="rooms-warning-close" @click="dismissTip('temp_power')">&times;</span>
          </div>
          <div v-if="!hiddenTips.room_delay" class="rooms-desc-warning">
            <span v-html="t.rooms?.warning_room_delay"></span>
            <span class="rooms-warning-close" @click="dismissTip('room_delay')">&times;</span>
          </div>
        </div>

        <div class="rooms-sim-area">
          <!-- Temporary bonus input -->
          <div class="rooms-temp-bonus-bar">
            <label class="rooms-temp-bonus-label">
              <span class="rooms-temp-bonus-help">
                <img src="../assets/icons/info.svg" alt="info" class="rooms-info-icon" />
                <span class="rooms-temp-bonus-tooltip">{{ t.rooms?.temp_bonus_tooltip || 'Temporary bonus not counted for league promotion (freon, hamsters, etc.)' }}</span>
              </span>
              {{ t.rooms?.temp_bonus || 'Temp Bonus' }}
            </label>
            <div class="rooms-temp-bonus-input-group">
              <input
                type="number"
                class="rooms-temp-bonus-input"
                :value="tempBonus"
                @input="tempBonus = parseFloat($event.target.value) || 0"
                min="0"
                step="0.01"
                placeholder="0"
              />
              <span class="rooms-temp-bonus-pct">%</span>
            </div>
          </div>

          <!-- Stats block -->
          <div class="rooms-stats-block">
            <!-- Power with temp bonus (top line, only if tempBonus > 0) -->
            <div v-if="tempBonus > 0" class="rooms-stats-box rooms-stats-temp">
              <div class="rooms-stats-line">
                <span class="rooms-stat-power">{{ formatPower(totalPowerWithTemp) }}</span>
                <span class="rooms-stat-sep">|</span>
                <span class="rooms-stat-bonus">{{ totalBonusWithTemp.toFixed(2) }}%</span>
              </div>
            </div>
            <!-- Power / Bonus centered -->
            <div class="rooms-stats-box">
              <div class="rooms-stats-line">
                <span class="rooms-stat-power">{{ formatPower(totalPower) }}</span>
                <span class="rooms-stat-sep">|</span>
                <span class="rooms-stat-bonus">{{ totalBonus.toFixed(2) }}%</span>
              </div>
              <div class="rooms-stats-line">
                <span :class="['rooms-stat-change', powerChange > 0 ? 'positive' : powerChange < 0 ? 'negative' : 'neutral']">
                  <span v-if="powerChange !== 0" v-html="powerChange > 0 ? '&#9650;' : '&#9660;'"></span>
                  {{ formatPower(Math.abs(powerChange)) }}
                </span>
                <span class="rooms-stat-sep">|</span>
                <span :class="['rooms-stat-change', bonusChange > 0 ? 'positive' : bonusChange < 0 ? 'negative' : 'neutral']">
                  <span v-if="bonusChange !== 0" v-html="bonusChange > 0 ? '&#9650;' : '&#9660;'"></span>
                  {{ Math.abs(bonusChange).toFixed(2) }}%
                </span>
              </div>
            </div>
            <!-- Raw miners power + undo/redo -->
            <div class="rooms-raw-power-bar">
              <span class="rooms-raw-power-text">{{ t.rooms?.miners_power }}: {{ formatPower(rawPower) }}</span>
              <div class="rooms-undo-redo">
                <button @click="undo" :disabled="historyIndex <= 0" :title="t.rooms?.undo">&#8630;</button>
                <button @click="redo" :disabled="historyIndex >= history.length - 1" :title="t.rooms?.redo">&#8631;</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Room tabs -->
      <div class="rooms-tabs">
        <button
          v-for="i in 4"
          :key="i"
          :class="['rooms-tab', { active: currentRoom === i, 'inactive-room': !activeRooms[i - 1] }]"
          @click="selectRoom(i)"
        >
          {{ i }}
        </button>
      </div>

      <!-- Room grid -->
      <div
        ref="gridContainer"
        class="rooms-grid-container"
        :style="{ backgroundImage: 'url(' + getRoomSkinUrl(selectedSkin) + ')' }"
        @mousedown="onDragStart"
        @mousemove="onDragMove"
        @mouseup="onDragEnd"
        @mouseleave="onDragEnd"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onDragEnd"
      >
        <transition :name="slideDirection">
          <div :key="currentRoom" class="rooms-grid-wrapper">
            <template v-if="activeRooms[currentRoom - 1]">
              <div class="rooms-grid" :style="gridScaleStyle">
                <div
                  v-for="(row, rowIdx) in currentRoomLayout"
                  :key="rowIdx"
                  class="rooms-grid-row"
                >
                  <div
                    v-for="(pair, pairIdx) in getPairsForRow(row, rowIdx)"
                    :key="pairIdx"
                    class="room-rack-pair"
                  >
                    <div
                      v-for="(cell, ci) in pair.cells"
                      :key="ci"
                      :class="['room-rack-cell', cell.isSlot ? 'has-slot' : 'empty-slot', { 'drop-target-valid': dragItem && isDropTarget(currentRoom, rowIdx, cell.colIdx), 'drop-target-hover': dragItem && isDropHover(currentRoom, rowIdx, cell.colIdx) }]"
                      :data-drop-key="currentRoom + '-' + rowIdx + '-' + cell.colIdx"
                    >
                      <template v-if="cell.isSlot">
                        <!-- Rack image as base layer -->
                        <div
                          :class="['room-rack-inner', { 'manual-active': manualMode && getRackInSlot(currentRoom, rowIdx, cell.colIdx) }]"
                          @mouseenter="!isMobile && manualMode && getRackInSlot(currentRoom, rowIdx, cell.colIdx) && showRackRemove(currentRoom, rowIdx, cell.colIdx, $event)"
                          @mouseleave="!isMobile && hideRackRemove(false)"
                        >
                          <button
                            v-if="isMobile && manualMode && getRackInSlot(currentRoom, rowIdx, cell.colIdx)"
                            class="room-rack-remove-mobile"
                            @click.stop="removeRackFromRoom(currentRoom, rowIdx, cell.colIdx)"
                          >&times;</button>
                          <img
                            v-if="getRackInSlot(currentRoom, rowIdx, cell.colIdx)"
                            :src="getRackImageUrl(getRackInSlot(currentRoom, rowIdx, cell.colIdx))"
                            alt="rack"
                            :class="['room-rack-img', getRackInSlot(currentRoom, rowIdx, cell.colIdx).size === 6 ? 'rack-img-6' : 'rack-img-8', narrowRackIds.includes(getRackInSlot(currentRoom, rowIdx, cell.colIdx).id) ? 'rack-img-narrow' : '', specialRackIds.includes(getRackInSlot(currentRoom, rowIdx, cell.colIdx).id) ? 'rack-img-special' : '']"
                          />
                          <!-- Miners overlay on top of rack image -->
                          <div :class="['room-miners-overlay', getRackInSlot(currentRoom, rowIdx, cell.colIdx) && getRackInSlot(currentRoom, rowIdx, cell.colIdx).size === 6 ? 'overlay-6' : 'overlay-8', narrowRackIds.includes((getRackInSlot(currentRoom, rowIdx, cell.colIdx) || {}).id) ? 'overlay-narrow' : '', specialRackIds.includes((getRackInSlot(currentRoom, rowIdx, cell.colIdx) || {}).id) ? 'overlay-special' : '']">
                            <template v-for="(minerSlot, mIdx) in getRackMiners(currentRoom, rowIdx, cell.colIdx)">
                              <div
                                :key="mIdx"
                                :class="['room-miner-cell', { 'span-2': minerSlot.span === 2, 'has-miner': !!minerSlot.miner, 'manual-miner': manualMode && minerSlot.miner, 'auto-added': minerSlot.miner && autoAddedUids.has(minerSlot.miner.uid) }]"
                                @mouseenter="minerSlot.miner && showMinerTooltip(minerSlot.miner, $event)"
                                @mouseleave="hideMinerTooltip"
                                @click.stop="manualMode && minerSlot.miner && removeMinerFromRoom(currentRoom, rowIdx, cell.colIdx, minerSlot.miner)"
                              >
                                <template v-if="minerSlot.miner">
                                  <img
                                    :src="getMinerImageUrl(minerSlot.miner)"
                                    :alt="minerSlot.miner.name"
                                    :class="['miner-thumb', { 'default-miner-img': isDefaultMinerImg(minerSlot.miner) }]"
                                  />
                                  <div class="room-miner-badges">
                                    <img
                                      v-if="minerSlot.miner.isLegacy"
                                      :src="getAssetUrl('others/legacy.png')"
                                      alt="legacy"
                                      class="room-badge-icon"
                                    />
                                    <img
                                      v-else-if="getRarityLevel(minerSlot.miner.name)"
                                      :src="getLevelIcon(minerSlot.miner.name)"
                                      alt="level"
                                      class="room-badge-icon"
                                    />
                                    <img
                                      v-if="getMinerSetName(minerSlot.miner)"
                                      :src="getAssetUrl('others/set.png')"
                                      alt="set"
                                      class="room-badge-icon"
                                    />
                                  </div>
                                  <!-- Remove X overlay in manual mode (CSS only) -->
                                  <div v-if="manualMode" class="room-miner-remove-overlay">&times;</div>
                                </template>
                              </div>
                            </template>
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="room-empty-placeholder">
                {{ t.rooms?.empty_room }}
              </div>
            </template>
          </div>
        </transition>
      </div>
    </div>

    <!-- ========== RIGHT PANEL ========== -->
    <div class="rooms-right" ref="rightPanel" :style="rightPanelStyle">
      <!-- How it works -->
      <button class="rooms-how-btn" @click="showHowItWorks = true">
        <img src="../assets/icons/info2.svg" alt="" class="rooms-how-icon" />
        <span>{{ t.rooms?.how_it_works }}</span>
      </button>

      <!-- Active rooms config -->
      <div class="rooms-active-config">
        <div class="rooms-active-label">{{ t.rooms?.active_rooms }}</div>
        <div class="rooms-active-switches">
          <button
            v-for="i in 4"
            :key="i"
            :class="['rooms-active-btn', { active: activeRooms[i - 1] }]"
            @click="onActiveRoomClick(i)"
          >
            {{ i }}
          </button>
        </div>
        <!-- Skin selector button -->
        <button class="rooms-skin-btn" @click="showSkinSelector = true">
          {{ t.rooms?.change_skin }}
        </button>
      </div>

      <!-- Simulation toggle button -->
      <button
        :class="['rooms-sim-btn', { active: simulationActive }]"
        @click="toggleSimulation"
      >
        {{ simulationActive ? t.rooms?.simulation_on_label : t.rooms?.simulation_off_label }}
      </button>

      <!-- Manual mode toggle -->
      <button
        :class="['rooms-manual-btn', { active: manualMode }]"
        @click="manualMode = !manualMode"
      >
        {{ manualMode ? t.rooms?.manual_on_label : t.rooms?.manual_off_label }}
      </button>

      <!-- Burning mode toggle (hidden for now) -->
      <button
        v-if="false"
        :class="['rooms-burning-btn', { active: burningMode }]"
        @click="burningMode = !burningMode"
      >
        {{ burningMode ? (t.rooms?.burning_on_label || 'BURNING MODE ON') : (t.rooms?.burning_off_label || 'ACTIVATE BURNING MODE') }}
      </button>

      <!-- Tab buttons -->
      <div class="rooms-right-buttons">
        <button
          :class="['rooms-right-btn', { active: mode === 'auto' }]"
          @click="mode = 'auto'"
        >{{ t.rooms?.auto }}</button>
        <button
          :class="['rooms-right-btn', { active: mode === 'miners' }]"
          @click="mode = 'miners'"
        >{{ t.rooms?.miners }}</button>
        <button
          :class="['rooms-right-btn', { active: mode === 'racks' }]"
          @click="mode = 'racks'"
        >{{ t.rooms?.racks }}</button>
      </div>

      <!-- Tab content area -->
      <div :class="['rooms-tab-content', { 'rooms-tab-content-stretch': mode !== 'auto' }]">
        <!-- ===== AUTO MODE ===== -->
        <template v-if="mode === 'auto'">
          <div class="rooms-auto-panel">
            <div class="rooms-auto-info">{{ t.rooms?.auto_description }}</div>
            <div class="rooms-auto-row">
              <span class="rooms-auto-label">{{ t.rooms?.max_power }}</span>
              <input
                type="number"
                v-model.number="autoMaxPower"
                class="rooms-auto-input"
                placeholder=""
                min="0"
                step="0.001"
              />
            </div>

            <div class="rooms-auto-row">
              <span class="rooms-auto-label">{{ t.rooms?.priority || 'Priority' }}</span>
              <div class="rooms-auto-order">
                <button
                  :class="['rooms-auto-order-btn', { active: autoPriority === 'default' }]"
                  @click="autoPriority = 'default'"
                >{{ t.rooms?.priority_default || 'Default' }}</button>
                <button
                  :class="['rooms-auto-order-btn', { active: autoPriority === 'power' }]"
                  :disabled="!autoMaxPower"
                  @click="autoPriority = 'power'"
                >{{ t.rooms?.priority_power || 'Raw Power' }}</button>
                <button
                  :class="['rooms-auto-order-btn', { active: autoPriority === 'bonus' }]"
                  :disabled="!autoMaxPower"
                  @click="autoPriority = 'bonus'"
                >{{ t.rooms?.priority_bonus || 'Bonus' }}</button>
              </div>
            </div>

            <div class="rooms-auto-row">
              <span class="rooms-auto-label">{{ t.rooms?.auto_include || 'Include' }}</span>
              <div class="rooms-auto-order">
                <button
                  :class="['rooms-auto-order-btn', { active: autoSellable === 'both' }]"
                  @click="autoSellable = 'both'"
                >{{ t.rooms?.filter_all || 'All' }}</button>
                <button
                  :class="['rooms-auto-order-btn', 'rooms-auto-seg-btn', { active: autoSellable === 'sellable' }]"
                  @click="autoSellable = 'sellable'"
                ><img :src="sellableIconUrl" alt="" class="rooms-auto-seg-icon" />{{ t.rooms?.filter_sellable || 'Sellable' }}</button>
                <button
                  :class="['rooms-auto-order-btn', 'rooms-auto-seg-btn', { active: autoSellable === 'no-sellable' }]"
                  @click="autoSellable = 'no-sellable'"
                ><img :src="noSellableIconUrl" alt="" class="rooms-auto-seg-icon" />{{ t.rooms?.filter_not_sellable || 'Not sellable' }}</button>
              </div>
            </div>

            <!-- <div class="rooms-auto-checkbox">
              <input type="checkbox" id="autoEmptyRooms" v-model="autoEmptyRooms" />
              <label for="autoEmptyRooms">{{ t.rooms?.empty_rooms_before || 'Empty rooms before' }}</label>
            </div> -->

            <button class="rooms-auto-go" @click="runAutoFill">{{ t.rooms?.go }}</button>
          </div>
        </template>

        <!-- ===== MINERS ===== -->
        <template v-else-if="mode === 'miners'">
          <!-- SELECT step -->
          <div v-if="manualAddStep === 'select' || manualMode" class="rooms-list-panel">
            <div class="rooms-list-header">
              <template v-if="manualMode">{{ t.rooms?.click_or_drag_miners || 'CLICK OR DRAG MINERS TO ADD TO THE ROOM' }}</template>
              <template v-else>
                {{ t.rooms?.select_miners }}
                <div class="rooms-list-header-note">{{ t.rooms?.select_miners_note }}</div>
              </template>
            </div>
            <div class="rooms-list-controls">
              <input
                type="text"
                class="rooms-list-search"
                :placeholder="t.rooms?.search"
                v-model="minerSearch"
              />
              <div class="rooms-sort-wrapper">
                <button class="rooms-list-btn" @click="showMinerSort = !showMinerSort">{{ t.rooms?.sort }}</button>
                <div v-if="showMinerSort" class="rooms-sort-menu">
                  <div :class="['rooms-sort-option', { active: minerSortBy === 'power-desc' }]" @click="minerSortBy = 'power-desc'; showMinerSort = false">Power &#9660;</div>
                  <div :class="['rooms-sort-option', { active: minerSortBy === 'power-asc' }]" @click="minerSortBy = 'power-asc'; showMinerSort = false">Power &#9650;</div>
                  <div :class="['rooms-sort-option', { active: minerSortBy === 'bonus-desc' }]" @click="minerSortBy = 'bonus-desc'; showMinerSort = false">Bonus &#9660;</div>
                  <div :class="['rooms-sort-option', { active: minerSortBy === 'bonus-asc' }]" @click="minerSortBy = 'bonus-asc'; showMinerSort = false">Bonus &#9650;</div>
                  <div :class="['rooms-sort-option', { active: minerSortBy === 'ratio-asc' }]" @click="minerSortBy = 'ratio-asc'; showMinerSort = false">Ratio &#9650;</div>
                  <div :class="['rooms-sort-option', { active: minerSortBy === 'ratio-desc' }]" @click="minerSortBy = 'ratio-desc'; showMinerSort = false">Ratio &#9660;</div>
                </div>
              </div>
              <div class="rooms-filter-wrapper">
                <button :class="['rooms-list-btn', { active: hasActiveMinerFilter }]" @click="toggleMinerFilter">{{ t.rooms?.filter || 'FILTER' }}</button>
                <div v-if="showMinerFilter" class="rooms-filter-backdrop" @click="showMinerFilter = false"></div>
                <div v-if="showMinerFilter" class="rooms-filter-menu" @click.stop @mousedown.stop>
                  <!-- Sellable -->
                  <div class="rooms-filter-seg">
                    <button :class="['rooms-filter-seg-btn', { active: minerFilterSellable === 'all' }]" @click="minerFilterSellable = 'all'">{{ t.rooms?.filter_all || 'All' }}</button>
                    <button :class="['rooms-filter-seg-btn', { active: minerFilterSellable === 'sellable' }]" @click="minerFilterSellable = 'sellable'">
                      <img :src="sellableIconUrl" alt="" class="rooms-filter-seg-icon" />{{ t.rooms?.filter_sellable || 'Sellable' }}
                    </button>
                    <button :class="['rooms-filter-seg-btn', { active: minerFilterSellable === 'no-sellable' }]" @click="minerFilterSellable = 'no-sellable'">
                      <img :src="noSellableIconUrl" alt="" class="rooms-filter-seg-icon" />{{ t.rooms?.filter_not_sellable || 'Not sellable' }}
                    </button>
                  </div>

                  <!-- Power range -->
                  <div class="rooms-filter-block">
                    <div class="rooms-filter-label">{{ t.rooms?.filter_power_range || 'Power range (Gh/s)' }}</div>
                    <div class="rooms-range-slider">
                      <div class="rooms-range-track"></div>
                      <div class="rooms-range-fill" :style="powerFillStyle"></div>
                      <input type="range" class="rooms-range-input" :min="minerPowerBounds.min" :max="minerPowerBounds.max" :step="powerStep" :value="powerMinVal" @input="onPowerMinInput" />
                      <input type="range" class="rooms-range-input" :min="minerPowerBounds.min" :max="minerPowerBounds.max" :step="powerStep" :value="powerMaxVal" @input="onPowerMaxInput" />
                    </div>
                    <div class="rooms-range-inputs">
                      <input type="number" class="rooms-range-num" :value="powerMinVal" @input="onPowerMinInput" />
                      <span class="rooms-range-dash">-</span>
                      <input type="number" class="rooms-range-num" :value="powerMaxVal" @input="onPowerMaxInput" />
                    </div>
                  </div>

                  <!-- Bonus range -->
                  <div class="rooms-filter-block">
                    <div class="rooms-filter-label">{{ t.rooms?.filter_bonus_range || 'Bonus range (%)' }}</div>
                    <div class="rooms-range-slider">
                      <div class="rooms-range-track"></div>
                      <div class="rooms-range-fill" :style="bonusFillStyle"></div>
                      <input type="range" class="rooms-range-input" :min="minerBonusBounds.min" :max="minerBonusBounds.max" step="1" :value="bonusMinVal" @input="onBonusMinInput" />
                      <input type="range" class="rooms-range-input" :min="minerBonusBounds.min" :max="minerBonusBounds.max" step="1" :value="bonusMaxVal" @input="onBonusMaxInput" />
                    </div>
                    <div class="rooms-range-inputs">
                      <input type="number" class="rooms-range-num" :value="bonusMinVal" @input="onBonusMinInput" />
                      <span class="rooms-range-dash">-</span>
                      <input type="number" class="rooms-range-num" :value="bonusMaxVal" @input="onBonusMaxInput" />
                    </div>
                  </div>

                  <button class="rooms-filter-reset" @click="resetMinerFilter">{{ t.rooms?.filter_reset || 'RESET' }}</button>
                </div>
              </div>
              <button :class="['rooms-list-btn', { active: editMode }]" @click="editMode = !editMode">{{ t.rooms?.edit || 'Edit' }}</button>
            </div>
            <div v-if="filteredAvailableMiners.length > 0" class="rooms-list-grid">
              <div
                v-for="miner in stackedAvailableMiners"
                :key="miner.name + '|' + miner.power + '|' + miner.bonus"
                :class="['rooms-list-card', { 'added-manually': miner.addedManually, 'manual-selected': !manualMode && miner._instances.some(inst => manualSelectedMiners[inst.uid]), 'removing': minerRemovalKey === (miner.name + '|' + miner.power + '|' + miner.bonus), 'adding': minerAddKey === (miner.name + '|' + miner.power + '|' + miner.bonus) }]"
                @click="editMode ? openEditMiner(miner) : (!manualMode && selectStackedMiner(miner))"
                @mousedown="!editMode && manualMode && onManualMouseDown('miner', miner._instances[0], $event)"
              >
                <div class="rooms-list-card-actions" @click.stop @mousedown.stop>
                  <button class="rooms-list-card-delete" @click="startMinerRemoval(miner)">&times;</button>
                  <button class="rooms-list-card-add-btn" @click="startMinerAddDuplicate(miner)">+</button>
                </div>
                <span class="rooms-list-card-qty-row">
                  <span v-if="miner._stackQty > 1" class="rooms-list-card-stack-qty">{{ miner._stackQty }}</span>
                  <a
                    v-if="isMinerSellable(miner)"
                    :href="getMinerSellLink(miner)"
                    target="_blank"
                    rel="noopener"
                    class="rooms-list-card-sellable-link"
                    :title="t.rooms?.sell_on_rollercoin || 'Sell on RollerCoin'"
                    @click.stop
                    @mousedown.stop
                  >
                    <img :src="sellableIconUrl" alt="sellable" class="rooms-list-card-sellable" />
                  </a>
                  <img
                    v-else
                    :src="noSellableIconUrl"
                    alt="not sellable"
                    :title="t.rooms?.filter_not_sellable || 'Not sellable'"
                    class="rooms-list-card-sellable"
                  />
                  <span class="rooms-list-card-quantity">{{ (miner.cells || 1) === 1 ? '1 cell' : '2 cells' }}</span>
                </span>
                <div class="rooms-list-card-img-area">
                  <div class="rooms-list-card-miner-row">
                    <img
                      :src="getMinerImageUrl(miner)"
                      :alt="miner.name"
                      :class="['rooms-list-card-miner-img', { 'default-miner-img': isDefaultMinerImg(miner) }]"
                    />
                    <div class="rooms-list-card-badges">
                      <img
                        v-if="miner.isLegacy"
                        :src="getAssetUrl('others/legacy.png')"
                        alt="legacy"
                        class="badge-icon"
                      />
                      <img
                        v-else-if="getRarityLevel(miner.name)"
                        :src="getLevelIcon(miner.name)"
                        alt="level"
                        class="badge-icon"
                      />
                      <img
                        v-if="getMinerSetName(miner)"
                        :src="getAssetUrl('others/set.png')"
                        alt="set"
                        class="badge-icon"
                      />
                    </div>
                  </div>
                  <div v-if="editMode && findMiner(miner)" class="rooms-edit-pencil-overlay">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rooms-edit-pencil-svg"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  </div>
                </div>
                <div class="rooms-list-card-info">
                  <template v-if="!manualMode && minerSelectState[miner.name + '|' + miner.power + '|' + miner.bonus]">
                    <div class="rooms-list-card-select-qty" @click.stop>
                      <button class="rooms-add-qty-btn" @click="changeMinerSelectQty(miner, -1)">-</button>
                      <span class="rooms-add-qty-val">{{ minerSelectState[miner.name + '|' + miner.power + '|' + miner.bonus].qty }}</span>
                      <button class="rooms-add-qty-btn" @click="changeMinerSelectQty(miner, 1)">+</button>
                    </div>
                  </template>
                  <template v-else>
                    <div class="rooms-list-card-name" :title="getCleanName(miner.name)">{{ getCleanName(miner.name) }}</div>
                    <div class="rooms-list-card-stats">
                      <span class="rooms-list-card-power">{{ miner.power }}</span>
                      <span class="rooms-list-card-sep">|</span>
                      <span class="rooms-list-card-bonus">{{ miner.bonus }}%</span>
                    </div>
                    <div class="rooms-list-card-ratio">ratio {{ minerRatioLabel(miner) }}</div>
                  </template>
                </div>
                <div v-if="minerRemovalKey === (miner.name + '|' + miner.power + '|' + miner.bonus)" class="rooms-rack-remove-overlay" @click.stop @mousedown.stop>
                  <div class="rooms-rack-remove-qty">
                    <button class="rooms-add-qty-btn" @click="minerRemovalQty = Math.max(1, minerRemovalQty - 1)">-</button>
                    <input
                      type="number"
                      class="rooms-rack-remove-input"
                      :value="minerRemovalQty"
                      @input="onMinerRemovalInput($event)"
                      @blur="clampMinerRemovalInput($event)"
                      min="1"
                      :max="minerRemovalMax"
                    />
                    <button class="rooms-add-qty-btn" @click="minerRemovalQty = Math.min(minerRemovalMax, minerRemovalQty + 1)">+</button>
                  </div>
                  <button class="rooms-rack-remove-confirm" @click="confirmMinerRemoval">{{ t.rooms?.delete || 'DELETE' }}</button>
                </div>
                <div v-if="minerAddKey === (miner.name + '|' + miner.power + '|' + miner.bonus)" class="rooms-rack-remove-overlay" @click.stop @mousedown.stop>
                  <div class="rooms-rack-remove-qty">
                    <button class="rooms-add-qty-btn" @click="minerAddQty = Math.max(1, minerAddQty - 1)">-</button>
                    <input type="number" class="rooms-rack-remove-input" :value="minerAddQty" @input="e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) minerAddQty = v }" min="1" />
                    <button class="rooms-add-qty-btn" @click="minerAddQty++">+</button>
                  </div>
                  <button class="rooms-rack-add-confirm" @click="confirmMinerAddDuplicate">{{ t.rooms?.add || 'ADD' }}</button>
                </div>
              </div>
            </div>
            <div v-else class="rooms-list-empty">
              {{ t.rooms?.no_miners }}
            </div>
            <button
              v-if="!manualMode && manualSelectedCount > 0"
              class="rooms-manual-continue-btn"
              @click="continueManualAdd"
            >{{ t.rooms?.continue || 'CONTINUE' }} ({{ manualSelectedCount }})</button>
          </div>

          <!-- SUMMARY step -->
          <div v-else-if="!manualMode && manualAddStep === 'summary' && manualAddPlan" class="rooms-list-panel rooms-manual-summary-panel">
            <!-- Scrollable sections area -->
            <div class="rooms-manual-scroll-area">
              <!-- Miners to ADD -->
              <div class="rooms-manual-section">
                <div class="rooms-manual-section-title rooms-manual-add-title">{{ t.rooms?.manual_to_add || 'TO ADD' }}</div>
                <div v-for="m in manualAddPlan.toAdd" :key="'add-' + m.uid" class="rooms-manual-summary-item rooms-manual-item-add">
                  <img v-if="getMinerImageUrl(m)" :src="getMinerImageUrl(m)" :alt="m.name" class="rooms-manual-summary-img" />
                  <div class="rooms-manual-summary-info">
                    <span class="rooms-manual-summary-name">{{ getCleanName(m.name) }}</span>
                    <span class="rooms-manual-summary-stats">{{ m.power }} | {{ m.bonus }}%</span>
                  </div>
                </div>
              </div>

              <!-- Miners to REMOVE -->
              <div v-if="manualAddPlan.toRemove.length > 0" class="rooms-manual-section">
                <div class="rooms-manual-section-title rooms-manual-remove-title">{{ t.rooms?.manual_to_remove || 'TO REMOVE' }}</div>
                <div v-for="m in manualAddPlan.toRemove" :key="'rem-' + m.uid" class="rooms-manual-summary-item rooms-manual-item-remove">
                  <img v-if="getMinerImageUrl(m)" :src="getMinerImageUrl(m)" :alt="m.name" class="rooms-manual-summary-img" />
                  <div class="rooms-manual-summary-info">
                    <span class="rooms-manual-summary-name">{{ getCleanName(m.name) }}</span>
                    <span class="rooms-manual-summary-stats">{{ m.power }} | {{ m.bonus }}%</span>
                  </div>
                </div>
              </div>

              <!-- Rack changes -->
              <div v-if="manualAddPlan.rackChanges.length > 0" class="rooms-manual-section">
                <div class="rooms-manual-section-title">{{ t.rooms?.manual_rack_changes || 'RACK CHANGES' }}</div>
                <div
                  v-for="(rc, idx) in manualAddPlan.rackChanges"
                  :key="'rc-' + idx"
                  :class="['rooms-manual-summary-item', rc.type === 'add' ? 'rooms-manual-item-add' : 'rooms-manual-item-remove']"
                >
                  <img :src="getRackImageUrl(rc.rack)" :alt="rc.rack.name" class="rooms-manual-summary-img" />
                  <div class="rooms-manual-summary-info">
                    <span class="rooms-manual-summary-name">{{ rc.rack.name }}</span>
                    <span class="rooms-manual-summary-stats">{{ rc.type === 'add' ? '+' : '-' }}{{ rc.qty }} | {{ rc.rack.size }} cells{{ rc.rack.bonus ? ' | ' + rc.rack.bonus + '%' : '' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pinned bottom: stats + actions -->
            <div class="rooms-manual-bottom">
              <div class="rooms-manual-stats-summary">
                <div class="rooms-manual-stats-row">
                  <span class="rooms-manual-stats-label">{{ t.rooms?.change || 'CHANGE' }}:</span>
                  <span :class="['rooms-manual-stats-value', manualAddPlan.powerDelta > 0 ? 'positive' : manualAddPlan.powerDelta < 0 ? 'negative' : 'neutral']">
                    <span v-if="manualAddPlan.powerDelta !== 0" v-html="manualAddPlan.powerDelta > 0 ? '&#9650;' : '&#9660;'"></span>
                    {{ formatPower(Math.abs(manualAddPlan.powerDelta)) }}
                  </span>
                  <span class="rooms-stat-sep">|</span>
                  <span :class="['rooms-manual-stats-value', manualAddPlan.bonusDelta > 0 ? 'positive' : manualAddPlan.bonusDelta < 0 ? 'negative' : 'neutral']">
                    {{ manualAddPlan.bonusDelta > 0 ? '+' : '' }}{{ manualAddPlan.bonusDelta.toFixed(2) }}%
                  </span>
                </div>
                <div class="rooms-manual-stats-row">
                  <span class="rooms-manual-stats-label">{{ t.rooms?.total_power || 'TOTAL' }}:</span>
                  <span class="rooms-manual-stats-value">{{ formatPower(manualAddPlan.newPower) }}</span>
                  <span class="rooms-stat-sep">|</span>
                  <span class="rooms-manual-stats-value">{{ manualAddPlan.newBonus.toFixed(2) }}%</span>
                </div>
              </div>

              <div class="rooms-manual-actions">
                <button class="rooms-confirm-no" @click="cancelManualAdd">{{ t.rooms?.cancel || 'CANCEL' }}</button>
                <button class="rooms-confirm-yes" @click="confirmManualAdd">{{ t.rooms?.confirm || 'CONFIRM' }}</button>
              </div>
            </div>
          </div>
        </template>

        <!-- ===== RACKS ===== -->
        <template v-else-if="mode === 'racks'">
          <div class="rooms-list-panel">
            <div class="rooms-list-header">
              {{ t.rooms?.click_or_drag_racks }}
            </div>
            <div class="rooms-list-controls">
              <input
                type="text"
                class="rooms-list-search"
                :placeholder="t.rooms?.search"
                v-model="rackSearch"
              />
              <button class="rooms-list-btn" @click="showAddModal = 'racks'">{{ t.rooms?.add }}</button>
              <div class="rooms-sort-wrapper">
                <button class="rooms-list-btn" @click="showRackSort = !showRackSort">{{ t.rooms?.sort }}</button>
                <div v-if="showRackSort" class="rooms-sort-menu">
                  <div :class="['rooms-sort-option', { active: rackSortBy === 'bonus-desc' }]" @click="rackSortBy = 'bonus-desc'; showRackSort = false">Bonus &#9660;</div>
                  <div :class="['rooms-sort-option', { active: rackSortBy === 'bonus-asc' }]" @click="rackSortBy = 'bonus-asc'; showRackSort = false">Bonus &#9650;</div>
                </div>
              </div>
            </div>
            <div v-if="sortedAvailableRacks.length > 0" class="rooms-list-grid">
              <div
                v-for="rack in sortedAvailableRacks"
                :key="rack.id + '-' + rack.index"
                :class="['rooms-list-card', { 'added-manually': rack.addedManually, 'removing': rackRemovalId === (rack.id || rack.name), 'adding': rackAddId === (rack.id || rack.name) }]"
                @mousedown="manualMode && onManualMouseDown('rack', rack, $event)"
              >
                <div class="rooms-list-card-actions" @click.stop @mousedown.stop>
                  <button class="rooms-list-card-delete" @click="startRackRemoval(rack)">&times;</button>
                  <button class="rooms-list-card-add-btn" @click="startRackAdd(rack)">+</button>
                </div>
                <span class="rooms-list-card-qty-row">
                  <span v-if="rack.available > 1" class="rooms-list-card-stack-qty">{{ rack.available }}</span>
                  <span class="rooms-list-card-quantity">{{ rack.size }} cells</span>
                </span>
                <div class="rooms-list-card-img-area">
                  <div class="rooms-list-card-miner-row">
                    <img
                      :src="getRackImageUrl(rack)"
                      :alt="rack.name"
                      class="rooms-list-card-miner-img"
                    />
                    <div v-if="rack.is_set" class="rooms-list-card-badges">
                      <img :src="getAssetUrl('others/set.png')" alt="set" class="badge-icon" />
                    </div>
                  </div>
                </div>
                <div class="rooms-list-card-info">
                  <div class="rooms-list-card-name" :title="rack.name">{{ rack.name }}</div>
                  <div v-if="rack.bonus > 0" class="rooms-list-card-stats">
                    <span class="rooms-list-card-bonus">{{ rack.bonus }}%</span>
                  </div>
                </div>
                <!-- Removal overlay -->
                <div v-if="rackRemovalId === (rack.id || rack.name)" class="rooms-rack-remove-overlay" @click.stop @mousedown.stop>
                  <div class="rooms-rack-remove-qty">
                    <button class="rooms-add-qty-btn" @click="rackRemovalQty = Math.max(1, rackRemovalQty - 1)">-</button>
                    <input
                      type="number"
                      class="rooms-rack-remove-input"
                      :value="rackRemovalQty"
                      @input="onRackRemovalInput($event)"
                      @blur="clampRackRemovalInput($event)"
                      min="1"
                      :max="rackRemovalMax"
                    />
                    <button class="rooms-add-qty-btn" @click="rackRemovalQty = Math.min(rackRemovalMax, rackRemovalQty + 1)">+</button>
                  </div>
                  <button class="rooms-rack-remove-confirm" @click="confirmRackRemoval">{{ t.rooms?.delete || 'DELETE' }}</button>
                </div>
                <div v-if="rackAddId === (rack.id || rack.name)" class="rooms-rack-remove-overlay" @click.stop @mousedown.stop>
                  <div class="rooms-rack-remove-qty">
                    <button class="rooms-add-qty-btn" @click="rackAddQty = Math.max(1, rackAddQty - 1)">-</button>
                    <input type="number" class="rooms-rack-remove-input" :value="rackAddQty" @input="e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) rackAddQty = v }" min="1" />
                    <button class="rooms-add-qty-btn" @click="rackAddQty++">+</button>
                  </div>
                  <button class="rooms-rack-add-confirm" @click="confirmRackAdd">{{ t.rooms?.add || 'ADD' }}</button>
                </div>
              </div>
            </div>
            <div v-else class="rooms-list-empty">
              {{ t.rooms?.no_racks }}
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- ========== MODALS ========== -->

    <!-- Image Preview Modal -->
    <div v-if="previewImage" class="rooms-preview-overlay" @click="closePreview">
      <div class="rooms-preview-container" @click.stop>
        <img :src="previewImage" alt="Preview" class="rooms-preview-img" />
        <button class="rooms-preview-close" @click="closePreview">&times;</button>
      </div>
    </div>

    <!-- How it works modal -->
    <div v-if="showHowItWorks" class="rooms-modal-overlay" @click="!hiwFirstTime && (showHowItWorks = false)">
      <div class="hiw-modal" @click.stop>
        <button v-if="!hiwFirstTime" class="rooms-modal-close" @click="showHowItWorks = false">
          <img src="../assets/icons/times.svg" alt="Close" class="rooms-close-icon" />
        </button>
        <div class="hiw-title">{{ t.rooms?.how_it_works }}</div>

        <!-- Section tabs -->
        <div class="hiw-tabs">
          <button
            v-for="(sec, idx) in howItWorksData"
            :key="idx"
            :class="['hiw-tab', { active: hiwSection === idx }]"
            @click="hiwSection = idx; hiwDetail = 0; $nextTick(() => hiwScrollTab())"
          >{{ sec.section }}</button>
        </div>

        <!-- Current detail content -->
        <template v-if="howItWorksData[hiwSection]">
          <div class="hiw-text">{{ howItWorksData[hiwSection].details[hiwDetail]?.text }}</div>

          <div class="hiw-img-area">
            <button
              class="hiw-arrow hiw-arrow-left"
              :disabled="hiwSection === 0 && hiwDetail === 0"
              @click="hiwPrev"
            ><img :src="arrowIconUrl" alt="prev" class="hiw-arrow-icon hiw-arrow-icon-left" /></button>
            <div class="hiw-img-container">
              <img
                v-if="howItWorksData[hiwSection].details[hiwDetail]?.img"
                :src="getHiwImage(howItWorksData[hiwSection].details[hiwDetail].img)"
                :alt="howItWorksData[hiwSection].section"
                class="hiw-img"
              />
              <div v-else class="hiw-img-placeholder">IMG</div>
            </div>
            <button
              class="hiw-arrow hiw-arrow-right"
              :disabled="hiwIsLastPage"
              @click="hiwNext"
            ><img :src="arrowIconUrl" alt="next" class="hiw-arrow-icon" /></button>
          </div>

          <div class="hiw-dots">
            <span
              v-for="(d, idx) in howItWorksData[hiwSection].details"
              :key="idx"
              :class="['hiw-dot', { active: hiwDetail === idx }]"
              @click="hiwDetail = idx"
            ></span>
          </div>

          <!-- Close button on last page -->
          <button v-if="hiwIsLastPage" class="hiw-go-btn" @click="closeHiw">
            {{ t.rooms?.hiw_go || "LET'S GO!" }}
          </button>
        </template>
      </div>
    </div>

    <!-- Simulation save modal -->
    <div v-if="showSaveModal" class="rooms-modal-overlay">
      <div class="rooms-save-modal">
        <p>{{ t.rooms?.save_changes }}</p>
        <div class="rooms-save-buttons">
          <button class="rooms-save-btn" @click="saveSimulation">{{ t.rooms?.save }}</button>
          <button class="rooms-discard-btn" @click="discardSimulation">{{ t.rooms?.discard }}</button>
        </div>
      </div>
    </div>

    <!-- Confirm deactivate modal -->
    <div v-if="confirmDeactivateRoom !== null" class="rooms-confirm-overlay">
      <div class="rooms-confirm-modal">
        <p>{{ t.rooms?.confirm_deactivate }}</p>
        <div class="rooms-confirm-buttons">
          <button class="rooms-confirm-yes" @click="confirmDeactivate">{{ t.rooms?.confirm }}</button>
          <button class="rooms-confirm-no" @click="confirmDeactivateRoom = null">{{ t.rooms?.cancel }}</button>
        </div>
      </div>
    </div>

    <!-- Add miners/racks modal -->
    <div v-if="showAddModal" class="rooms-modal-overlay" @click="closeAddModal">
      <div class="rooms-add-modal" @click.stop>
        <button class="rooms-modal-close" @click="closeAddModal">&times;</button>
        <div class="rooms-add-modal-title">{{ showAddModal === 'miners' ? t.rooms?.add_miners_title : t.rooms?.add_racks_title }}</div>
        <div class="rooms-add-controls">
          <input
            type="text"
            class="rooms-add-search"
            :placeholder="t.rooms?.search"
            v-model="addModalSearch"
          />
          <div class="rooms-sort-wrapper">
            <button class="rooms-list-btn" @click="showAddSort = !showAddSort">{{ t.rooms?.sort }}</button>
            <div v-if="showAddSort" class="rooms-sort-menu">
              <template v-if="showAddModal === 'miners'">
                <div :class="['rooms-sort-option', { active: addModalSortBy === 'power-desc' }]" @click="addModalSortBy = 'power-desc'; showAddSort = false">Power &#9660;</div>
                <div :class="['rooms-sort-option', { active: addModalSortBy === 'power-asc' }]" @click="addModalSortBy = 'power-asc'; showAddSort = false">Power &#9650;</div>
                <div :class="['rooms-sort-option', { active: addModalSortBy === 'bonus-desc' }]" @click="addModalSortBy = 'bonus-desc'; showAddSort = false">Bonus &#9660;</div>
                <div :class="['rooms-sort-option', { active: addModalSortBy === 'bonus-asc' }]" @click="addModalSortBy = 'bonus-asc'; showAddSort = false">Bonus &#9650;</div>
              </template>
              <template v-else>
                <div :class="['rooms-sort-option', { active: addModalSortBy === 'bonus-desc' }]" @click="addModalSortBy = 'bonus-desc'; showAddSort = false">Bonus &#9660;</div>
                <div :class="['rooms-sort-option', { active: addModalSortBy === 'bonus-asc' }]" @click="addModalSortBy = 'bonus-asc'; showAddSort = false">Bonus &#9650;</div>
              </template>
            </div>
          </div>
        </div>
        <div class="rooms-add-grid">
          <!-- MINERS -->
          <template v-if="showAddModal === 'miners'">
            <div
              v-for="miner in addModalFilteredMiners"
              :key="miner.id"
              :class="['rooms-add-card', { selected: addModalSelected[miner.id] }]"
              @click="toggleAddSelect(miner.id)"
            >
              <div class="rooms-add-card-img-area">
                <img :src="getAssetUrl('miner/' + miner.filename)" :alt="miner.name" class="rooms-add-card-img" />
              </div>
              <div class="rooms-add-card-info">
                <div class="rooms-add-card-name">{{ miner.name }}</div>
                <div class="rooms-add-card-stats">
                  <span>{{ miner.power }}</span>
                  <span class="rooms-list-card-sep">|</span>
                  <span class="rooms-list-card-bonus">{{ miner.bonus }}%</span>
                </div>
              </div>
            </div>
          </template>
          <!-- RACKS -->
          <template v-else>
            <div
              v-for="rack in addModalFilteredRacks"
              :key="rack.id || rack.name"
              :class="['rooms-add-card', { selected: addModalSelected[rack.id || rack.name] }]"
              @click="toggleAddSelect(rack.id || rack.name)"
            >
              <div class="rooms-add-card-img-area">
                <div class="rooms-list-card-miner-row">
                  <img :src="getRackImageUrl(rack)" :alt="rack.name" class="rooms-list-card-miner-img" />
                  <div v-if="rack.is_set" class="rooms-list-card-badges">
                    <img :src="getAssetUrl('others/set.png')" alt="set" class="badge-icon" />
                  </div>
                </div>
              </div>
              <div class="rooms-add-card-info">
                <div class="rooms-add-card-name">{{ rack.name }}</div>
                <div class="rooms-add-card-stats">
                  <span>{{ rack.size }} cells</span>
                  <template v-if="rack.bonus > 0">
                    <span class="rooms-list-card-sep">|</span>
                    <span class="rooms-list-card-bonus">{{ rack.bonus }}%</span>
                  </template>
                </div>
                <!-- Quantity selector for racks -->
                <div v-if="addModalSelected[rack.id || rack.name]" class="rooms-add-qty" @click.stop>
                  <button class="rooms-add-qty-btn" @click="changeAddQty(rack.id || rack.name, -1)">-</button>
                  <span class="rooms-add-qty-val">{{ addModalSelected[rack.id || rack.name] }}</span>
                  <button class="rooms-add-qty-btn" @click="changeAddQty(rack.id || rack.name, 1)">+</button>
                </div>
              </div>
            </div>
          </template>
        </div>
        <!-- Action buttons -->
        <div class="rooms-add-actions">
          <button
            :class="['rooms-add-confirm-btn', { disabled: !hasAddSelection }]"
            :disabled="!hasAddSelection"
            @click="confirmAddModal"
          >{{ t.rooms?.add }}</button>
          <button class="rooms-add-cancel-btn" @click="closeAddModal">{{ t.rooms?.cancel }}</button>
        </div>
      </div>
    </div>

    <!-- Skin selector modal -->
    <div v-if="showSkinSelector" class="rooms-modal-overlay" @click="showSkinSelector = false">
      <div class="rooms-skin-modal" @click.stop>
        <button class="rooms-modal-close" @click="showSkinSelector = false">&times;</button>
        <div class="rooms-skin-modal-title">{{ t.rooms?.change_skin }}</div>
        <div class="rooms-skin-grid">
          <div
            v-for="room in roomSkins"
            :key="room.id"
            :class="['rooms-skin-item', { active: selectedSkin === room.id }]"
            @click="selectSkin(room.id); showSkinSelector = false"
          >
            <img :src="getRoomSkinUrl(room.id)" :alt="room.name" />
            <span class="rooms-skin-name">{{ room.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm clear rooms modal -->
    <div v-if="showClearRoomsConfirm" class="rooms-confirm-overlay">
      <div class="rooms-confirm-modal">
        <p>{{ t.rooms?.confirm_clear_rooms }}</p>
        <div class="rooms-confirm-buttons">
          <button class="rooms-confirm-yes" @click="clearRooms">{{ t.rooms?.confirm }}</button>
          <button class="rooms-confirm-no" @click="showClearRoomsConfirm = false">{{ t.rooms?.cancel }}</button>
        </div>
      </div>
    </div>

    <!-- Confirm clear all modal -->
    <div v-if="showClearConfirm" class="rooms-confirm-overlay">
      <div class="rooms-confirm-modal">
        <p>{{ t.rooms?.confirm_clear }}</p>
        <div class="rooms-confirm-buttons">
          <button class="rooms-confirm-yes" @click="clearAll">{{ t.rooms?.confirm }}</button>
          <button class="rooms-confirm-no" @click="showClearConfirm = false">{{ t.rooms?.cancel }}</button>
        </div>
      </div>
    </div>

    <!-- Auto Import Modal -->
    <div v-if="showAutoImport" class="rooms-confirm-overlay" @click.self="showAutoImport = null; autoImportHelpOpen = null">
      <div class="rooms-auto-import-modal">
        <!-- Step 1: Select method -->
        <template v-if="showAutoImport === 'select'">
          <h2 class="rooms-ai-title">{{ t.rooms?.auto_import || 'AUTO IMPORT ROOMS' }}</h2>
          <div class="rooms-ai-options">
            <div class="rooms-ai-option">
              <h3>Network (F12)</h3>
              <div class="rooms-ai-option-desc">
                {{ t.rooms?.ai_network_desc || 'Import your rooms configuration from RollerCoin\'s network data' }}
              </div>
              <button class="rooms-ai-option-btn" @click="showAutoImport = 'network'">
                {{ t.rooms?.ai_continue || 'CONTINUE' }}
              </button>
            </div>
            <div class="rooms-ai-option rooms-ai-option-disabled">
              <h3>{{ t.rooms?.ai_screenshot_title || 'Screenshot' }}</h3>
              <div class="rooms-ai-option-desc">
                {{ t.rooms?.ai_screenshot_desc || 'Import your rooms from screenshots using image recognition' }}
              </div>
              <button class="rooms-ai-option-btn" disabled>
                {{ t.rooms?.ai_coming_soon || 'COMING SOON' }}
              </button>
            </div>
          </div>
        </template>

        <!-- Step 2: Network import -->
        <template v-if="showAutoImport === 'network'">
          <h2 class="rooms-ai-title">Network</h2>
          <div class="rooms-ai-instructions">
            <b>{{ t.rooms?.ai_how_to || 'How to get the data:' }}</b>
            <div class="rooms-ai-help-hint" v-html="(t.rooms?.ai_help_hint || 'Click {?} for help').replace('{?}', '<img src=\'' + infoIconUrl + '\' class=\'rooms-info-icon\' />')"></div>
            <ol class="rooms-ai-steps">
              <li v-for="step in 7" :key="step" class="rooms-ai-step">
                <div class="rooms-ai-step-header">
                  <span class="rooms-ai-step-text" v-html="getStepText(step)"></span>
                  <button
                    class="rooms-ai-help-btn"
                    :class="{ active: autoImportHelpOpen === step }"
                    @click="autoImportHelpOpen = autoImportHelpOpen === step ? null : step"
                  ><img src="../assets/icons/info.svg" alt="?" class="rooms-info-icon" /></button>
                </div>
                <div v-if="autoImportHelpOpen === step" class="rooms-ai-help-detail">
                  <div class="rooms-ai-help-text">{{ t.rooms?.['ai_help' + step] }}</div>
                  <img
                    v-if="getAutoImportHelpImg(step)"
                    :src="getAutoImportHelpImg(step)"
                    class="rooms-ai-help-img"
                    @click="previewImage = getAutoImportHelpImg(step)"
                  />
                </div>
              </li>
            </ol>
          </div>
          <div class="rooms-ai-network-content">
            <textarea
              v-model="autoImportText"
              class="rooms-textarea rooms-ai-textarea"
              :placeholder="t.rooms?.ai_paste || 'Paste the JSON response here...'"
            ></textarea>
            <img
              v-if="networkExampleImg"
              :src="networkExampleImg"
              alt="Network example"
              class="rooms-ai-example-img"
              @click="previewImage = networkExampleImg"
            />
          </div>
          <div class="rooms-ai-actions">
            <button class="rooms-ai-back-btn" @click="showAutoImport = 'select'">{{ t.rooms?.ai_back || '← BACK' }}</button>
            <button class="rooms-ai-import-btn" @click="importFromNetwork" :disabled="!autoImportText.trim()">
              {{ t.rooms?.ai_import || 'IMPORT' }}
            </button>
          </div>
          <div v-if="autoImportError" class="rooms-ai-error">{{ autoImportError }}</div>
          <div v-if="autoImportSuccess" class="rooms-ai-success">{{ autoImportSuccess }}</div>
        </template>
      </div>
    </div>
    <!-- Edit Miner Modal -->
    <div v-if="editMiner" class="rooms-modal-overlay" @click="editMiner = null">
      <div class="rooms-edit-modal" @click.stop>
        <button class="rooms-modal-close" @click="editMiner = null">&times;</button>
        <div class="rooms-edit-modal-title">{{ t.rooms?.edit_miner || 'EDIT MINER' }}</div>
        <div class="rooms-edit-modal-desc">{{ t.rooms?.edit_miner_desc || 'Edit miner data. Changes are saved locally and reported for review.' }}</div>
        <div class="rooms-edit-modal-body">
          <div class="rooms-edit-modal-img">
            <img :src="getMinerImageUrl(editMiner)" :alt="editForm.name" />
            <div class="rooms-edit-modal-badges">
              <img
                v-if="editMiner.isLegacy"
                :src="getAssetUrl('others/legacy.png')"
                alt="legacy"
                class="badge-icon"
              />
              <img
                v-else-if="getRarityLevel(editMiner.name)"
                :src="getLevelIcon(editMiner.name)"
                alt="level"
                class="badge-icon"
              />
              <img
                v-if="getMinerSetName(editMiner)"
                :src="getAssetUrl('others/set.png')"
                alt="set"
                class="badge-icon"
              />
            </div>
          </div>
          <div class="rooms-edit-modal-fields">
            <div class="rooms-edit-field">
              <input type="text" v-model="editForm.name" class="rooms-edit-input rooms-edit-name" readonly />
            </div>
            <div class="rooms-edit-field rooms-edit-field-row">
              <label class="rooms-edit-label">POWER</label>
              <input type="number" v-model.number="editForm.powerValue" class="rooms-edit-input" step="0.001" />
              <select v-model="editForm.powerUnit" class="rooms-edit-select">
                <option value="Gh/s">Gh/s</option>
                <option value="Th/s">Th/s</option>
                <option value="Ph/s">Ph/s</option>
                <option value="Eh/s">Eh/s</option>
                <option value="Zh/s">Zh/s</option>
              </select>
            </div>
            <div class="rooms-edit-field rooms-edit-field-row">
              <label class="rooms-edit-label">BONUS</label>
              <div class="rooms-edit-input-group">
                <input type="number" v-model.number="editForm.bonus" class="rooms-edit-input" step="0.01" />
                <span class="rooms-edit-input-suffix">%</span>
              </div>
            </div>
            <div class="rooms-edit-field">
              <div class="rooms-edit-toggle-group">
                <button :class="['rooms-edit-toggle', { active: editForm.cells === 1 }]" @click="editForm.cells = 1">1 CELL</button>
                <button :class="['rooms-edit-toggle', { active: editForm.cells === 2 }]" @click="editForm.cells = 2">2 CELLS</button>
              </div>
            </div>
          </div>
        </div>
        <div class="rooms-edit-modal-actions">
          <button class="rooms-edit-cancel" @click="editMiner = null">{{ t.rooms?.cancel || 'Cancel' }}</button>
          <button class="rooms-edit-save" @click="saveEditMiner">{{ t.rooms?.save || 'Save' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import '../styles/rooms.css'
import exampleCollection from '../assets/example_collection.png'
import exampleInventory from '../assets/example_inventory.png'
import exampleSell from '../assets/example_sell.png'
import defaultMinerImg from '../assets/miners/default.svg'
import infoIconUrl from '../assets/icons/info.svg'
import arrowIconUrl from '../assets/icons/arrow.svg'
import sellableIconUrl from '../assets/icons/sellable.svg'
import noSellableIconUrl from '../assets/icons/no-sellable.svg'
let networkExampleImg = null
try { networkExampleImg = new URL('../assets/example_network_import.png', import.meta.url).href } catch (e) {}
const autoImportHelpImages = import.meta.glob('../assets/rooms/autoimport/*.png', { eager: true })
import { db } from '../firebase'
import { ref as dbRef, push } from 'firebase/database'
import minersData from '../assets/miners.json'
import mergesData from '../assets/merges.json'

// Apply saved miner edits from localStorage
const savedEdits = JSON.parse(localStorage.getItem('minerEdits') || '{}')
for (const key of Object.keys(savedEdits)) {
  const edit = savedEdits[key]
  const miner = minersData.find(m => m.id === edit.id)
  if (miner) {
    if (edit.power !== undefined) miner.power = edit.power
    if (edit.bonus !== undefined) miner.bonus = edit.bonus
    if (edit.cells !== undefined) miner.cells = edit.cells
    if (edit.can_be_sold !== undefined) miner.can_be_sold = edit.can_be_sold
  }
}
import racksData from '../assets/racks.json'
import setsData from '../assets/sets.json'
import roomSkinsData from '../assets/rooms.json'
import howitworksEn from '../assets/howitworks_en.json'
import howitworksEs from '../assets/howitworks_es.json'

// Import all room skin images
const roomSkinImages = import.meta.glob('../assets/rooms/*.png', { eager: true })

// Import all how-it-works images
const hiwImages = import.meta.glob('../assets/rooms/howitworks/*.png', { eager: true })

// Room layouts: true = rack slot, false = empty
// Desktop: 8 columns × 3 rows
// Room 1 (special):
// Row 0: all empty
// Row 1: all racks (8)
// Row 2: E E R R R R E E
const ROOM_1_LAYOUT = [
  [false, false, false, false, false, false, false, false],
  [true, true, true, true, true, true, true, true],
  [false, false, true, true, true, true, false, false]
]

// Rooms 2-4:
// Row 0: E E R R R R E E
// Row 1: all racks (8)
// Row 2: R R R R R R E E
const ROOM_DEFAULT_LAYOUT = [
  [false, false, true, true, true, true, false, false],
  [true, true, true, true, true, true, true, true],
  [true, true, true, true, true, true, false, false]
]

// Mobile: 4 columns × 5 rows
// Room 1 (12 slots): rows 1-3 full, rows 0,4 empty
const ROOM_1_LAYOUT_MOBILE = [
  [false, false, false, false],
  [true, true, true, true],
  [true, true, true, true],
  [true, true, true, true],
  [false, false, false, false]
]

// Rooms 2-4 (18 slots): rows 0-3 full (16), row 4 has 2 + 2 empty
const ROOM_DEFAULT_LAYOUT_MOBILE = [
  [true, true, true, true],
  [true, true, true, true],
  [true, true, true, true],
  [true, true, true, true],
  [true, true, false, false]
]

export default {
  name: 'Rooms',
  inject: ['i18n'],
  data() {
    return {
      storagePath: 'https://storage.googleapis.com/rc-calculator-d20ac.firebasestorage.app/',
      infoIconUrl,
      arrowIconUrl,
      sellableIconUrl,
      noSellableIconUrl,
      exampleImages: { collection: exampleCollection, inventory: exampleInventory, sell: exampleSell },
      roomSkins: roomSkinsData,
      selectedSkin: roomSkinsData[0]?.id || 'room_background',
      showSkinSelector: false,
      importText: '',
      previewImage: null,
      miners: minersData,
      loadedMiners: [],
      activeRooms: [true, false, false, false],
      currentRoom: 1,
      previousRoom: 1,
      slideDirection: 'room-slide-right',
      rooms: { 1: {}, 2: {}, 3: {}, 4: {} },
      hiddenTips: JSON.parse(localStorage.getItem('roomsHiddenTips') || '{}'),
      editMode: false,
      editMiner: null,
      editForm: { name: '', power: '', bonus: '', cells: 1, can_be_sold: false },
      tempBonus: parseFloat(localStorage.getItem('roomsTempBonus')) || 0,
      simulationActive: false,
      showSaveModal: false,
      simulationBackup: null,
      history: [],
      historyIndex: -1,
      lastPower: 0,
      lastBonus: 0,
      mode: 'miners',
      manualMode: false,
      contentTab: 'miners',
      showHowItWorks: false,
      hiwFirstTime: false,
      hiwSection: 0,
      hiwDetail: 0,
      autoOrderBy: 'power',
      autoMaxPower: null,
      autoPriority: 'default',
      autoSellable: 'both',
      autoEmptyRooms: true,
      autoAddedUids: new Set(),
      loading: false,
      minerSearch: '',
      minerSearchDebounced: '',
      minerSearchTimer: null,
      rackSearch: '',
      minerImageCache: {},
      minerSortBy: 'power-desc',
      rackSortBy: 'bonus-desc',
      showMinerSort: false,
      showRackSort: false,
      burningMode: false,
      showMinerFilter: false,
      minerFilterSellable: 'all',
      minerFilterPowerMin: null,
      minerFilterPowerMax: null,
      minerFilterBonusMin: null,
      minerFilterBonusMax: null,
      showAddModal: null,
      addModalSearch: '',
      addModalSelected: {},
      addModalSortBy: 'power-desc',
      showAddSort: false,
      confirmDeactivateRoom: null,
      showClearConfirm: false,
      showClearRoomsConfirm: false,
      dragStartX: null,
      isDragging: false,
      centerHeight: 0,
      gridScale: 1,
      isMobile: window.innerWidth <= 768,
      racksDefinitions: racksData,
      specialRackIds: ['66d575abd864b944e0a13b78'],
      narrowRackIds: ["69490713568b0838531375a8", "690a70aae6988d19928d7101", "6825aaa7e2da6536108ec08e", "66fa99502d94b5111cd82dd4", "66fa99512d94b5111cd82dd5", "684957c04df6651d4d5db391", "66fa99522d94b5111cd82dd6", "673481872593c7f3e68fcc9a", "6752f0a50b2ea70a05bc1c5c", "67c574e988262b01d3b36b8f", "687953dc850c0148212ddf82", "68dbc757c05c26894e019db2", "69777907ce7eeebdbd02fee0", "68109bc36cce9be19c451f58", "687953d5850c0148212ddf81", "6938408e4dba654aa4065fd9", "68dbc757c05c26894e019db1"],
      setsDefinitions: setsData,
      userRacks: [],
      rackRemovalId: null,
      rackRemovalQty: 1,
      rackRemovalMax: 1,
      minerRemovalKey: null,
      minerRemovalQty: 1,
      minerRemovalMax: 1,
      minerSelectState: {},
      minerAddKey: null,
      minerAddQty: 1,
      rackAddId: null,
      rackAddQty: 1,
      showAutoImport: null,
      autoImportText: '',
      autoImportError: '',
      autoImportSuccess: '',
      autoImportHelpOpen: null,
      networkExampleImg,
      manualSelectedMiners: {},
      manualAddStep: 'select',
      manualAddPlan: null,
      dragItem: null,
      dragOverSlot: null,
      validDropTargetKeys: null
    }
  },
  watch: {
    tempBonus(val) {
      localStorage.setItem('roomsTempBonus', String(val))
    },
    minerSearch(val) {
      clearTimeout(this.minerSearchTimer)
      this.minerSearchTimer = setTimeout(() => {
        this.minerSearchDebounced = val
      }, 200)
    },
    mode() {
      this.cancelManualAdd()
      this.autoAddedUids = new Set()
    },
    autoMaxPower(val) {
      if (!val && this.autoPriority !== 'default') this.autoPriority = 'default'
    },
    currentRoom() {
      this.cancelManualAdd()
    },
    manualMode() {
      this.cancelManualAdd()
    }
  },
  computed: {
    t() {
      return this.i18n.t
    },
    // Pre-built lookup maps for fast miner image resolution
    minerIdMap() {
      const map = {}
      this.miners.forEach(m => { map[m.id] = m })
      return map
    },
    minerNameMap() {
      const map = {}
      this.miners.forEach(m => { map[this.normalizeName(m.name)] = m })
      return map
    },
    mergesByBaseId() {
      const map = {}
      mergesData.forEach(m => { map[m.miner_id] = m })
      return map
    },
    mergesNameMap() {
      const map = {}
      mergesData.forEach(m => { map[this.normalizeName(m.name)] = m })
      return map
    },
    rightPanelStyle() {
      if (this.centerHeight > 0) {
        return { height: this.centerHeight + 'px' }
      }
      return {}
    },
    currentRoomLayout() {
      return this.getRoomLayout(this.currentRoom)
    },
    availableMiners() {
      const placedUids = new Set()
      for (let r = 1; r <= 4; r++) {
        const roomData = this.rooms[r]
        Object.values(roomData).forEach(slot => {
          if (slot.miners) {
            slot.miners.forEach(m => { if (m) placedUids.add(m.uid) })
          }
        })
      }
      return this.loadedMiners.filter(m => !placedUids.has(m.uid))
    },
    filteredAvailableMiners() {
      let list = this.availableMiners

      // Sellable / not sellable
      if (this.minerFilterSellable !== 'all') {
        const wantSellable = this.minerFilterSellable === 'sellable'
        list = list.filter(m => this.isMinerSellable(m) === wantSellable)
      }

      // Power range (in Gh/s)
      if (this.minerFilterPowerMin != null || this.minerFilterPowerMax != null) {
        const lo = this.minerFilterPowerMin != null ? this.minerFilterPowerMin : -Infinity
        const hi = this.minerFilterPowerMax != null ? this.minerFilterPowerMax : Infinity
        list = list.filter(m => {
          const p = this.parsePowerToGhs(m.power)
          return p >= lo && p <= hi
        })
      }

      // Bonus range (%)
      if (this.minerFilterBonusMin != null || this.minerFilterBonusMax != null) {
        const lo = this.minerFilterBonusMin != null ? this.minerFilterBonusMin : -Infinity
        const hi = this.minerFilterBonusMax != null ? this.minerFilterBonusMax : Infinity
        list = list.filter(m => {
          const b = parseFloat(m.bonus) || 0
          return b >= lo && b <= hi
        })
      }

      // Search
      const search = this.minerSearchDebounced.trim().toLowerCase()
      if (search) {
        list = list.filter(m => this.getCleanName(m.name).toLowerCase().includes(search))
      }

      return list
    },
    hasActiveMinerFilter() {
      return this.minerFilterSellable !== 'all' ||
        this.minerFilterPowerMin != null || this.minerFilterPowerMax != null ||
        this.minerFilterBonusMin != null || this.minerFilterBonusMax != null
    },
    minerPowerBounds() {
      const powers = this.loadedMiners.map(m => this.parsePowerToGhs(m.power))
      const max = powers.length ? Math.ceil(Math.max(...powers)) : 0
      return { min: 0, max }
    },
    minerBonusBounds() {
      const bonuses = this.loadedMiners.map(m => parseFloat(m.bonus) || 0)
      const max = bonuses.length ? Math.ceil(Math.max(...bonuses)) : 0
      return { min: 0, max }
    },
    powerStep() {
      const span = this.minerPowerBounds.max - this.minerPowerBounds.min
      return span > 0 ? Math.max(1, Math.round(span / 200)) : 1
    },
    powerMinVal() {
      return this.minerFilterPowerMin != null ? this.minerFilterPowerMin : this.minerPowerBounds.min
    },
    powerMaxVal() {
      return this.minerFilterPowerMax != null ? this.minerFilterPowerMax : this.minerPowerBounds.max
    },
    bonusMinVal() {
      return this.minerFilterBonusMin != null ? this.minerFilterBonusMin : this.minerBonusBounds.min
    },
    bonusMaxVal() {
      return this.minerFilterBonusMax != null ? this.minerFilterBonusMax : this.minerBonusBounds.max
    },
    powerFillStyle() {
      const { min, max } = this.minerPowerBounds
      const span = max - min || 1
      const lo = Math.max(0, Math.min(100, ((this.powerMinVal - min) / span) * 100))
      const hi = Math.max(0, Math.min(100, ((this.powerMaxVal - min) / span) * 100))
      return { left: lo + '%', width: Math.max(0, hi - lo) + '%' }
    },
    bonusFillStyle() {
      const { min, max } = this.minerBonusBounds
      const span = max - min || 1
      const lo = Math.max(0, Math.min(100, ((this.bonusMinVal - min) / span) * 100))
      const hi = Math.max(0, Math.min(100, ((this.bonusMaxVal - min) / span) * 100))
      return { left: lo + '%', width: Math.max(0, hi - lo) + '%' }
    },
    sortedAvailableMiners() {
      const list = [...this.filteredAvailableMiners]
      switch (this.minerSortBy) {
        case 'power-desc': return list.sort((a, b) => this.parsePowerToGhs(b.power) - this.parsePowerToGhs(a.power))
        case 'power-asc': return list.sort((a, b) => this.parsePowerToGhs(a.power) - this.parsePowerToGhs(b.power))
        case 'bonus-desc': return list.sort((a, b) => (parseFloat(b.bonus) || 0) - (parseFloat(a.bonus) || 0))
        case 'bonus-asc': return list.sort((a, b) => (parseFloat(a.bonus) || 0) - (parseFloat(b.bonus) || 0))
        case 'ratio-asc': return list.sort((a, b) => this.minerRatioValue(a) - this.minerRatioValue(b))
        case 'ratio-desc': return list.sort((a, b) => this.minerRatioValue(b) - this.minerRatioValue(a))
        default: return list
      }
    },
    stackedAvailableMiners() {
      const groups = {}
      this.sortedAvailableMiners.forEach(m => {
        const key = `${m.name}|${m.power}|${m.bonus}`
        if (!groups[key]) {
          groups[key] = { ...m, _stackQty: 0, _instances: [] }
        }
        groups[key]._stackQty++
        groups[key]._instances.push(m)
      })
      return Object.values(groups)
    },
    sortedAvailableRacks() {
      const list = [...this.filteredAvailableRacks]
      switch (this.rackSortBy) {
        case 'bonus-desc': return list.sort((a, b) => (b.bonus || 0) - (a.bonus || 0))
        case 'bonus-asc': return list.sort((a, b) => (a.bonus || 0) - (b.bonus || 0))
        default: return list
      }
    },
    addModalFilteredMiners() {
      const search = this.addModalSearch.toLowerCase()
      const already = new Set(this.loadedMiners.map(m => m.minerId || m.name))
      const list = this.miners.filter(m => {
        if (already.has(m.id)) return false
        if (search && !m.name.toLowerCase().includes(search)) return false
        return true
      })
      switch (this.addModalSortBy) {
        case 'power-desc': return list.sort((a, b) => this.parsePowerToGhs(b.power) - this.parsePowerToGhs(a.power))
        case 'power-asc': return list.sort((a, b) => this.parsePowerToGhs(a.power) - this.parsePowerToGhs(b.power))
        case 'bonus-desc': return list.sort((a, b) => (b.bonus || 0) - (a.bonus || 0))
        case 'bonus-asc': return list.sort((a, b) => (a.bonus || 0) - (b.bonus || 0))
        default: return list
      }
    },
    addModalFilteredRacks() {
      const search = this.addModalSearch.toLowerCase()
      const list = this.racksDefinitions.filter(r => {
        if (search && !r.name.toLowerCase().includes(search)) return false
        return true
      })
      switch (this.addModalSortBy) {
        case 'bonus-desc': return list.sort((a, b) => (b.bonus || 0) - (a.bonus || 0))
        case 'bonus-asc': return list.sort((a, b) => (a.bonus || 0) - (b.bonus || 0))
        default: return list
      }
    },
    hasAddSelection() {
      return Object.keys(this.addModalSelected).length > 0
    },
    allUserRacks() {
      // Merge base 66 Regular Rack 8 with userRacks
      const regularRack = this.racksDefinitions.find(r => r.name === 'Regular Rack 8')
      const merged = []

      if (regularRack) {
        const userExtra = this.userRacks.find(r => (r.id || r.name) === (regularRack.id || regularRack.name))
        const baseQty = 66 + (userExtra ? userExtra.quantity : 0)
        merged.push({ ...regularRack, quantity: baseQty, addedManually: false })
      }

      this.userRacks.forEach(ur => {
        const key = ur.id || ur.name
        if (regularRack && key === (regularRack.id || regularRack.name)) return // already merged
        merged.push(ur)
      })

      return merged
    },
    availableRacks() {
      const placedByType = {}
      for (let r = 1; r <= 4; r++) {
        Object.values(this.rooms[r]).forEach(slot => {
          if (slot.rack) {
            const key = slot.rack.id || slot.rack.name
            placedByType[key] = (placedByType[key] || 0) + 1
          }
        })
      }

      return this.allUserRacks
        .map((ur, idx) => {
          const key = ur.id || ur.name
          const placed = placedByType[key] || 0
          const available = Math.max(0, ur.quantity - placed)
          return { ...ur, available, index: idx }
        })
        .filter(r => r.available > 0)
    },
    filteredAvailableRacks() {
      if (!this.rackSearch.trim()) return this.availableRacks
      const search = this.rackSearch.toLowerCase()
      return this.availableRacks.filter(r => r.name.toLowerCase().includes(search))
    },
    // Raw power (sum of all miner powers without any bonus)
    rawPower() {
      let total = 0
      for (let r = 1; r <= 4; r++) {
        if (!this.activeRooms[r - 1]) continue
        Object.values(this.rooms[r]).forEach(slot => {
          if (slot.miners) {
            slot.miners.forEach(m => { if (m) total += this.parsePowerToGhs(m.power) })
          }
        })
      }
      return total
    },
    // General bonus (miner bonuses + set bonuses of type "bonus", NOT rack bonuses)
    // Duplicate miners (same name) only contribute bonus ONCE
    totalBonus() {
      let total = 0
      const seenBonus = new Set()
      for (let r = 1; r <= 4; r++) {
        if (!this.activeRooms[r - 1]) continue
        Object.values(this.rooms[r]).forEach(slot => {
          if (slot.miners) {
            slot.miners.forEach(m => {
              if (!m) return
              const key = `${m.name}|${m.power}|${m.bonus}`
              if (!seenBonus.has(key)) {
                seenBonus.add(key)
                total += parseFloat(m.bonus) || 0
              }
            })
          }
          const setBonus = this.getSlotSetBonus(slot)
          if (setBonus) {
            if (setBonus.type === 'bonus') total += setBonus.value
            else if (setBonus.type === 'mixed') total += setBonus.bonus
          }
        })
      }
      return total
    },
    // Rack bonus extra: each rack's bonus applies to the raw power of miners INSIDE it
    rackBonusExtra() {
      let total = 0
      for (let r = 1; r <= 4; r++) {
        if (!this.activeRooms[r - 1]) continue
        Object.values(this.rooms[r]).forEach(slot => {
          if (slot.rack && slot.rack.bonus && slot.miners) {
            let slotRaw = 0
            slot.miners.forEach(m => { if (m) slotRaw += this.parsePowerToGhs(m.power) })
            total += slotRaw * (slot.rack.bonus / 100)
          }
        })
      }
      return total
    },
    // Set power extra: set bonuses of type "power" (flat Gh/s added at the end)
    setPowerExtra() {
      let total = 0
      for (let r = 1; r <= 4; r++) {
        if (!this.activeRooms[r - 1]) continue
        Object.values(this.rooms[r]).forEach(slot => {
          const setBonus = this.getSlotSetBonus(slot)
          if (setBonus) {
            if (setBonus.type === 'power') total += setBonus.value
            else if (setBonus.type === 'mixed') total += setBonus.power
          }
        })
      }
      return total
    },
    // Effective power = rawPower * (1 + generalBonus/100) + rackBonusExtra + setPowerExtra
    totalPower() {
      return this.rawPower * (1 + this.totalBonus / 100) + this.rackBonusExtra + this.setPowerExtra
    },
    // Power with temp bonus applied on raw power
    totalPowerWithTemp() {
      if (this.tempBonus > 0) {
        return this.rawPower * (1 + (this.totalBonus + this.tempBonus) / 100) + this.rackBonusExtra + this.setPowerExtra
      }
      return this.totalPower
    },
    totalBonusWithTemp() {
      return this.totalBonus + this.tempBonus
    },
    // Active sets with their achieved bonuses
    activeSets() {
      const setMap = {}
      for (let r = 1; r <= 4; r++) {
        if (!this.activeRooms[r - 1]) continue
        Object.values(this.rooms[r]).forEach(slot => {
          const bonuses = this.getSlotSetBonuses(slot)
          if (bonuses.length === 0) return
          const setName = slot.rack.set
          const setDef = this.setsDefinitions.find(s => s.name === setName)
          if (!setDef) return

          let setMinerCount = 0
          if (slot.miners) {
            slot.miners.forEach(m => { if (m && this.getMinerSetName(m) === setName) setMinerCount++ })
          }

          // Find highest level achieved
          let maxLevel = 0
          for (const lvl of setDef.levels) {
            if (setMinerCount >= lvl.required && lvl.level > maxLevel) maxLevel = lvl.level
          }

          if (!setMap[setName]) {
            setMap[setName] = { name: setName, level: maxLevel, bonuses }
          }
        })
      }
      return Object.values(setMap)
    },
    howItWorksData() {
      return this.i18n.lang === 'ES' ? howitworksEs : howitworksEn
    },
    gridScaleStyle() {
      if (this.gridScale === 1) return {}
      return { transform: `scale(${this.gridScale})`, transformOrigin: 'center center' }
    },
    hiwIsLastPage() {
      if (!this.howItWorksData[this.hiwSection]) return true
      return this.hiwSection === this.howItWorksData.length - 1 &&
        this.hiwDetail >= this.howItWorksData[this.hiwSection].details.length - 1
    },
    manualSelectedCount() {
      return Object.keys(this.manualSelectedMiners).length
    },
    manualSelectedMinersList() {
      return this.loadedMiners.filter(m => this.manualSelectedMiners[m.uid])
    },
    powerChange() { return this.totalPower - this.lastPower },
    bonusChange() { return this.totalBonus - this.lastBonus },
    totalMinersInRooms() {
      let count = 0
      for (let r = 1; r <= 4; r++) {
        if (!this.activeRooms[r - 1]) continue
        Object.values(this.rooms[r]).forEach(slot => {
          if (slot.miners) slot.miners.forEach(m => { if (m) count++ })
        })
      }
      return count
    }
  },
  mounted() {
    this.loadFromStorage()
    this.lastPower = this.totalPower
    this.lastBonus = this.totalBonus
    this.saveSnapshot()
    // Show how-it-works on first visit
    if (!localStorage.getItem('rooms_hiw_seen')) {
      this.hiwFirstTime = true
      this.showHowItWorks = true
    }
    this.$nextTick(() => {
      const updateSizes = () => {
        this.isMobile = window.innerWidth <= 768
        const baseWidth = this.isMobile ? 300 : 750
        if (this.$refs.centerPanel) {
          this.centerHeight = this.$refs.centerPanel.offsetHeight
        }
        if (this.$refs.gridContainer) {
          const containerWidth = this.$refs.gridContainer.offsetWidth
          this.gridScale = Math.min(containerWidth / baseWidth, 1.5)
        }
      }
      this._resizeObserver = new ResizeObserver(updateSizes)
      if (this.$refs.centerPanel) {
        this._resizeObserver.observe(this.$refs.centerPanel)
      }
      if (this.$refs.gridContainer) {
        this._resizeObserver.observe(this.$refs.gridContainer)
      }
      updateSizes()
    })
  },
  beforeDestroy() {
    if (this._resizeObserver) this._resizeObserver.disconnect()
    this.hideMinerTooltip()
    this.hideRackRemove()
    this.hideSetTooltip()
  },
  methods: {
    // ========== LAYOUT ==========
    // Display layout (mobile or desktop)
    getRoomLayout(roomNum) {
      if (this.isMobile) {
        return roomNum === 1 ? ROOM_1_LAYOUT_MOBILE : ROOM_DEFAULT_LAYOUT_MOBILE
      }
      return roomNum === 1 ? ROOM_1_LAYOUT : ROOM_DEFAULT_LAYOUT
    },
    // Data layout (always desktop — used for storage keys)
    getDataLayout(roomNum) {
      return roomNum === 1 ? ROOM_1_LAYOUT : ROOM_DEFAULT_LAYOUT
    },
    // Map display rowIdx/colIdx to the data storage key
    getSlotDataKey(roomNum, rowIdx, colIdx) {
      if (!this.isMobile) return `${rowIdx}-${colIdx}`
      const map = this._getSlotKeyMap(roomNum)
      return map[`${rowIdx}-${colIdx}`] || `${rowIdx}-${colIdx}`
    },
    _getSlotKeyMap(roomNum) {
      if (!this._slotKeyMaps) this._slotKeyMaps = {}
      if (this._slotKeyMaps[roomNum]) return this._slotKeyMaps[roomNum]
      const desktopLayout = this.getDataLayout(roomNum)
      const mobileLayout = roomNum === 1 ? ROOM_1_LAYOUT_MOBILE : ROOM_DEFAULT_LAYOUT_MOBILE
      const desktopKeys = []
      for (let r = 0; r < desktopLayout.length; r++) {
        for (let c = 0; c < desktopLayout[r].length; c++) {
          if (desktopLayout[r][c]) desktopKeys.push(`${r}-${c}`)
        }
      }
      const map = {}
      let idx = 0
      for (let r = 0; r < mobileLayout.length; r++) {
        for (let c = 0; c < mobileLayout[r].length; c++) {
          if (mobileLayout[r][c]) map[`${r}-${c}`] = desktopKeys[idx++]
        }
      }
      this._slotKeyMaps[roomNum] = map
      return map
    },

    // ========== IMPORT / PARSE ==========
    parseInput(text) {
      const miners = []
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
      let uidCounter = Date.now()

      const findExisting = (miner) => {
        return miners.find(m =>
          m.name === miner.name &&
          m.power === miner.power &&
          m.bonus === miner.bonus &&
          m.source === miner.source
        )
      }

      const addMiner = (miner) => {
        miner.uid = uidCounter++
        const existing = findExisting(miner)
        if (existing) {
          if (miner.isSet && !existing.isSet) existing.isSet = true
          if (miner.minerId && !existing.minerId) existing.minerId = miner.minerId
          if ((miner.source === 'INVENTORY' || miner.source === 'SELL') && miner.quantity) {
            existing.quantity = (existing.quantity || 1) + miner.quantity
          }
        } else {
          miners.push(miner)
        }
      }

      const buildMinerEntry = (fields) => {
        const dbMiner = this.findMiner({ name: this.getCleanName(fields.name), minerId: fields.minerId || null })
        const cells = dbMiner ? dbMiner.cells : 2
        const setName = this.getMinerSetName({ name: fields.name })
        const resolvedMinerId = dbMiner ? dbMiner.id : (fields.minerId || null)
        return {
          uid: 0, name: fields.name, power: fields.power, bonus: fields.bonus,
          quantity: fields.quantity || 1, isSet: fields.isSet || false,
          isLegacy: fields.isLegacy || false, minerId: resolvedMinerId,
          cells, setName, source: fields.source
        }
      }

      let i = 0
      while (i < lines.length) {
        if ((lines[i].match(/^product\d*$/i) && !lines[i].includes('set badge')) ||
            lines[i] === 'In collection' ||
            lines[i].match(/^productRating star$/i)) {
          i++
          continue
        }

        // ========== COLLECTION FORMAT ==========
        const collectionBonusMatch = lines[i].match(/^Bonus power \+([\d.,]+)%$/i)
        if (collectionBonusMatch) {
          let bonus = collectionBonusMatch[1]
          let name = ''
          let power = ''
          let rarity = ''
          let isSet = false
          let isLegacy = false
          let minerId = null

          if (i + 1 < lines.length) {
            const idLine = lines[i + 1]
            const isSetBadge = idLine.includes('set badge')
            isLegacy = idLine.includes('Rating star')
            const cleanId = idLine.replace('set badge', '').replace('Rating star', '').trim()
            const idMatch = cleanId.match(/^([a-f0-9]{24})([1-5])?$/i)

            if (idMatch) {
              minerId = idMatch[1]
              if (idMatch[2]) {
                const rarityMap = { '1': 'Uncommon', '2': 'Rare', '3': 'Epic', '4': 'Legendary', '5': 'Unreal' }
                rarity = rarityMap[idMatch[2]] || ''
              }
              isSet = isSetBadge

              let nameIndex = i + 2
              if (isSet && nameIndex < lines.length) {
                if (lines[nameIndex].toLowerCase().endsWith(' set')) nameIndex++
              }

              if (nameIndex < lines.length) {
                name = lines[nameIndex]
                if (isLegacy) name = `Legacy ${name}`
                else if (rarity) name = `${rarity} ${name}`
              }

              let endIdx = nameIndex + 1
              for (let j = nameIndex + 1; j < Math.min(i + 12, lines.length); j++) {
                const powerMatch = lines[j].match(/^([\d.,]+)\s*(Gh\/s|Th\/s|Ph\/s|Eh\/s)$/i)
                if (powerMatch) power = `${powerMatch[1]} ${powerMatch[2]}`
                endIdx = j + 1
                if (lines[j] === 'Miner details') break
              }

              if (name && power) {
                addMiner(buildMinerEntry({ name, power, bonus, quantity: 1, isSet, isLegacy, minerId, source: 'COLLECTION' }))
              }
              i = endIdx - 1
            } else {
              i++
            }
          } else {
            i++
          }
          continue
        }

        // ========== INVENTORY FORMAT ==========
        const isInventoryLegacy = lines[i] === 'Rating star' && i + 2 < lines.length && lines[i + 2] === 'Set'
        const isInventorySetBadge = lines[i] === 'set badge' && i + 2 < lines.length && lines[i + 2] === 'Set'
        const isInventoryNormal = i + 1 < lines.length && lines[i + 1] === 'Set' && lines[i] !== 'Rating star' && lines[i] !== 'set badge'

        if (isInventoryLegacy || isInventorySetBadge || isInventoryNormal) {
          let name = ''
          let power = ''
          let bonus = ''
          let quantity = 1
          let isLegacy = isInventoryLegacy
          let isSet = isInventorySetBadge
          let startIndex = i

          if (isInventoryLegacy) {
            name = `Legacy ${lines[i + 1]}`
            startIndex = i + 1
          } else if (isInventorySetBadge) {
            let candidateName = lines[i + 1]
            startIndex = i + 1
            if (candidateName.toLowerCase().endsWith(' set') && i + 3 < lines.length) {
              candidateName = lines[i + 3]
              startIndex = i + 3
            }
            name = candidateName
          } else {
            name = lines[i]
            if (i > 0 && lines[i - 1].match(/^[1-5]$/)) {
              const prevPrevLine = i > 1 ? lines[i - 2].toLowerCase() : ''
              const isPropertyValue = prevPrevLine.match(/^(power|bonus|quantity|from|price|size|miner details|ph\/s|th\/s|eh\/s|gh\/s|%)[:.]?$/i) ||
                                       prevPrevLine.match(/\d+\s*(ph\/s|th\/s|eh\/s|gh\/s|%)/i)
              if (!isPropertyValue) {
                const rarityMap = { '1': 'Uncommon', '2': 'Rare', '3': 'Epic', '4': 'Legendary', '5': 'Unreal' }
                const rarity = rarityMap[lines[i - 1]]
                if (rarity) name = `${rarity} ${name}`
              }
            }
          }

          let foundQuantityLabel = false
          for (let j = startIndex + 2; j < Math.min(startIndex + 15, lines.length); j++) {
            const powerMatch = lines[j].match(/^([\d.,]+)\s*(Gh\/s|Th\/s|Ph\/s|Eh\/s)$/i)
            if (powerMatch) power = `${powerMatch[1]} ${powerMatch[2]}`
            const bonusMatch = lines[j].match(/^([\d.,]+)\s*%$/)
            if (bonusMatch) bonus = bonusMatch[1]
            if (lines[j].match(/^Quantity:?$/i)) foundQuantityLabel = true
            if (foundQuantityLabel && lines[j].match(/^\d+$/)) {
              quantity = parseInt(lines[j])
              foundQuantityLabel = false
            }
            if (lines[j] === 'Miner details') break
          }

          if (name && power && bonus !== '') {
            addMiner(buildMinerEntry({ name, power, bonus, quantity, isSet, isLegacy, minerId: null, source: 'INVENTORY' }))
          }
          i += (isInventoryLegacy || isInventorySetBadge) ? 2 : 1
          continue
        }

        // ========== SELL FORMAT (MOBILE) ==========
        const isMobileSell = i + 1 < lines.length &&
          lines[i + 1] === 'Size' &&
          !lines[i].match(/^[a-f0-9]{24}/i) &&
          !lines[i].match(/^(product|In collection|Rating star|set badge|\d+)$/i) &&
          !(i > 0 && lines[i - 1] === 'Set')

        if (isMobileSell) {
          let name = lines[i]
          let power = ''
          let bonus = ''
          let quantity = 1
          let isLegacy = false
          let isSet = false

          if (i > 0) {
            if (lines[i - 1] === 'Rating star') {
              isLegacy = true
              name = `Legacy ${name}`
            } else if (lines[i - 1] === 'set badge') {
              isSet = true
            } else if (lines[i - 1].match(/^(Uncommon|Rare|Epic|Legendary|Unreal)$/i)) {
              name = `${lines[i - 1]} ${name}`
            }
          }

          let foundQuantityLabelMobile = false
          for (let j = i + 2; j < Math.min(i + 15, lines.length); j++) {
            const powerMatch = lines[j].match(/^([\d.,]+)\s*(Gh\/s|Th\/s|Ph\/s|Eh\/s)$/i)
            if (powerMatch) power = `${powerMatch[1]} ${powerMatch[2]}`
            const bonusMatch = lines[j].match(/^([\d.,]+)\s*%$/)
            if (bonusMatch) bonus = bonusMatch[1]
            if (lines[j].match(/^Quantity:?$/i)) foundQuantityLabelMobile = true
            if (foundQuantityLabelMobile && lines[j].match(/^\d+$/)) {
              quantity = parseInt(lines[j])
              foundQuantityLabelMobile = false
            }
            if (lines[j] === 'iconSell Miner') break
          }

          if (name && power && bonus) {
            addMiner(buildMinerEntry({ name, power, bonus, quantity, isSet, isLegacy, minerId: null, source: 'SELL' }))
          }
          i++
          continue
        }

        // ========== SELL FORMAT (DESKTOP) ==========
        const sellIdMatch = lines[i].match(/^([a-f0-9]{24})([1-5])?(Rating star|set badge)?$/i)
        if (sellIdMatch) {
          const minerId = sellIdMatch[1]
          let name = ''
          let power = ''
          let bonus = ''
          let quantity = 1
          let rarity = ''
          let isLegacy = sellIdMatch[3] && sellIdMatch[3].toLowerCase() === 'rating star'
          let isSet = sellIdMatch[3] && sellIdMatch[3].toLowerCase() === 'set badge'

          if (sellIdMatch[2]) {
            const rarityMap = { '1': 'Uncommon', '2': 'Rare', '3': 'Epic', '4': 'Legendary', '5': 'Unreal' }
            rarity = rarityMap[sellIdMatch[2]] || ''
          }

          let nameIndex = i + 1
          // Skip rarity text line if present (may duplicate ID suffix rarity)
          if (nameIndex < lines.length && lines[nameIndex].match(/^(Uncommon|Rare|Epic|Legendary|Unreal)$/i)) {
            if (!rarity) rarity = lines[nameIndex]
            nameIndex++
          }

          if (nameIndex < lines.length) {
            name = lines[nameIndex]
            if (isSet && name.toLowerCase().endsWith(' set')) {
              nameIndex++
              if (nameIndex < lines.length) name = lines[nameIndex]
            }
            if (isLegacy) name = `Legacy ${name}`
            else if (rarity) name = `${rarity} ${name}`
          }

          let foundQuantityLabelDesktop = false
          let endIdx = nameIndex + 1
          for (let j = nameIndex + 1; j < Math.min(i + 20, lines.length); j++) {
            const powerMatch = lines[j].match(/^([\d.,]+)\s*(Gh\/s|Th\/s|Ph\/s|Eh\/s)$/i)
            if (powerMatch) power = `${powerMatch[1]} ${powerMatch[2]}`
            const bonusMatch = lines[j].match(/^([\d.,]+)\s*%$/)
            if (bonusMatch) bonus = bonusMatch[1]
            if (lines[j].match(/^Quantity:?$/i)) foundQuantityLabelDesktop = true
            if (foundQuantityLabelDesktop && lines[j].match(/^\d+$/)) {
              quantity = parseInt(lines[j])
              foundQuantityLabelDesktop = false
            }
            endIdx = j + 1
            if (lines[j] === 'iconSell Miner') break
          }

          if (name && power && bonus) {
            addMiner(buildMinerEntry({ name, power, bonus, quantity, isSet, isLegacy, minerId, source: 'SELL' }))
          }
          i = endIdx - 1
          continue
        }

        i++
      }
      return miners
    },

    addMiners() {
      if (!this.importText.trim()) return
      this.loading = true
      setTimeout(() => {
        const newMiners = this.parseInput(this.importText)
        if (newMiners.length > 0) {
          let uidCounter = Date.now()
          newMiners.forEach(newMiner => {
            // Find existing by name+power+bonus (regardless of source)
            const existing = this.loadedMiners.find(m =>
              m.name === newMiner.name && m.power === newMiner.power && m.bonus === newMiner.bonus
            )

            if (existing) {
              // Update minerId if we didn't have it
              if (newMiner.minerId && !existing.minerId) {
                this.loadedMiners.filter(m =>
                  m.name === newMiner.name && m.power === newMiner.power && m.bonus === newMiner.bonus
                ).forEach(m => { if (!m.minerId) m.minerId = newMiner.minerId })
              }
              if (newMiner.isSet && !existing.isSet) existing.isSet = true

              if (newMiner.source === 'SELL' || newMiner.source === 'INVENTORY') {
                // Count how many instances of this miner already exist
                const currentQty = this.loadedMiners.filter(m =>
                  m.name === newMiner.name && m.power === newMiner.power && m.bonus === newMiner.bonus
                ).length
                if (newMiner.quantity > currentQty) {
                  const toAdd = newMiner.quantity - currentQty
                  for (let k = 0; k < toAdd; k++) {
                    this.loadedMiners.push({
                      ...newMiner,
                      uid: uidCounter++,
                      cells: existing.cells,
                      setName: existing.setName
                    })
                  }
                }
              }
              // COLLECTION source: already exists, skip (no duplicates)
            } else {
              // Miner doesn't exist yet
              if (newMiner.source === 'SELL' || newMiner.source === 'INVENTORY') {
                // Add quantity instances
                for (let k = 0; k < (newMiner.quantity || 1); k++) {
                  this.loadedMiners.push({ ...newMiner, uid: uidCounter++ })
                }
              } else {
                // COLLECTION: add 1 instance
                newMiner.uid = uidCounter++
                this.loadedMiners.push(newMiner)
              }
            }
          })
          this.importText = ''
          this.minerImageCache = {}
          this.saveToStorage()
        }
        this.loading = false
      }, 50)
    },

    clearImport() { this.importText = '' },

    // ========== AUTO IMPORT FROM NETWORK ==========
    getStepText(step) {
      if (step === 1) {
        return (this.t.rooms?.ai_step1 || 'Go to') + ' <a class="source-link" href="https://rollercoin.com/game" target="_blank">rollercoin.com/game</a>'
      }
      return this.t.rooms?.['ai_step' + step] || ''
    },
    getAutoImportHelpImg(step) {
      const key = `../assets/rooms/autoimport/step${step}.png`
      const mod = autoImportHelpImages[key]
      return mod ? mod.default : ''
    },
    importFromNetwork() {
      this.autoImportError = ''
      this.autoImportSuccess = ''
      try {
        const raw = this.autoImportText.trim()
        const json = JSON.parse(raw)
        const data = json.data || json

        if (!data.miners || !data.racks) {
          this.autoImportError = 'Invalid data: missing miners or racks'
          return
        }

        let uidCounter = Date.now()
        const placedUids = new Set()

        // Build rack map: user_rack_id → rack network data
        const rackMap = {}
        for (const r of data.racks) { rackMap[r._id] = r }

        // Ensure all network miners exist in loadedMiners (create missing ones)
        const claimedForCheck = new Set()
        for (const m of data.miners) {
          const netName = (m.name || '').toLowerCase().trim()
          const netPowerGhs = m.power || 0

          // Build expected name with rarity prefix for accurate matching
          const levelMap = { 1: 'Uncommon', 2: 'Rare', 3: 'Epic', 4: 'Legendary', 5: 'Unreal' }
          const prefix = m.type === 'merge' && m.level > 0 ? (levelMap[m.level] || '') : ''
          const expectedName = prefix ? `${prefix} ${m.name}` : m.name

          // Check if we already have a matching miner (not yet claimed for this check)
          const existing = this.loadedMiners.find(lm => {
            if (claimedForCheck.has(lm.uid)) return false
            // Compare full names (including rarity prefix) for exact match
            if (lm.name.toLowerCase().trim() === expectedName.toLowerCase().trim()) {
              const lmPower = this.parsePowerToGhs(lm.power)
              return Math.abs(lmPower - netPowerGhs) < Math.max(netPowerGhs * 0.01, 1)
            }
            // Fallback: match by clean name only if neither has a rarity prefix
            const lmRarity = this.getRarityLevel(lm.name)
            if (!lmRarity && !prefix) {
              const lmClean = this.getCleanName(lm.name).toLowerCase().trim()
              if (lmClean !== netName) return false
              const lmPower = this.parsePowerToGhs(lm.power)
              return Math.abs(lmPower - netPowerGhs) < Math.max(netPowerGhs * 0.01, 1)
            }
            return false
          })

          if (existing) {
            claimedForCheck.add(existing.uid)
          } else {
            const power = this._formatPower(netPowerGhs)
            const bonus = String((m.bonus_percent || 0) / 100)
            const cells = m.width || 2
            const minerId = m.miner_id || null
            const dbMiner = this.findMiner({ name: m.name, minerId })
            const newUid = uidCounter++
            this.loadedMiners.push({
              uid: newUid,
              name: expectedName,
              power, bonus, cells,
              minerId: dbMiner ? dbMiner.id : minerId,
              isSet: m.is_in_set || false,
              isLegacy: false,
              setName: this.getMinerSetName({ name: expectedName, setName: (dbMiner && dbMiner.is_set && dbMiner.set) ? dbMiner.set : null }),
              source: 'NETWORK'
            })
            claimedForCheck.add(newUid)
          }
        }

        // Ensure all network racks exist in userRacks (create missing ones)
        const rackCounts = {}
        for (const r of data.racks) {
          rackCounts[r.rack_id] = (rackCounts[r.rack_id] || 0) + 1
        }
        for (const [rackId, needed] of Object.entries(rackCounts)) {
          const existing = this.userRacks.find(ur => ur.id === rackId)
          if (existing) {
            if (existing.quantity < needed) existing.quantity = needed
          } else {
            const dbRack = this.racksDefinitions.find(rd => rd.id === rackId)
            if (dbRack) {
              this.userRacks.push({ ...dbRack, quantity: needed, addedManually: false })
            }
          }
        }

        // Build rooms: place racks in their positions
        const activeRooms = [...this.activeRooms]
        const rooms = { 1: {}, 2: {}, 3: {}, 4: {} }

        const availableRooms = data.rooms_available || data.rooms || []
        for (const ar of availableRooms) {
          const level = ar.room_info?.level
          if (level >= 0 && level <= 3) activeRooms[level] = true
        }

        // Place racks in room slots using flat index mapped to our grid
        for (const r of data.racks) {
          const roomNum = r.placement.room_level + 1
          if (roomNum < 1 || roomNum > 4) continue

          // Convert network x,y to our slot key
          const layout = this.getDataLayout(roomNum)
          const networkCols = r.placement.x !== undefined ? Math.max(4, ...data.racks.filter(rr => rr.placement.room_level === r.placement.room_level).map(rr => rr.placement.x + 1)) : 4
          const flatIdx = r.placement.y * networkCols + r.placement.x

          // Map flat index to our layout slot key
          let slotIdx = 0
          let slotKey = null
          for (let row = 0; row < layout.length; row++) {
            for (let col = 0; col < layout[row].length; col++) {
              if (!layout[row][col]) continue
              if (slotIdx === flatIdx) { slotKey = `${row}-${col}`; break }
              slotIdx++
            }
            if (slotKey) break
          }
          if (!slotKey) continue

          const rackId = r.rack_id
          const dbRack = this.racksDefinitions.find(rd => rd.id === rackId)
          rooms[roomNum][slotKey] = {
            rack: dbRack
              ? { ...dbRack }
              : { id: rackId, name: r.name, size: (r.rack_info.width || 2) * (r.rack_info.height || 4), bonus: (r.bonus || 0) / 100, is_set: r.is_in_set || false, set: null },
            miners: []
          }
          // Store userRackId for miner placement lookup
          rooms[roomNum][slotKey]._userRackId = r._id
        }

        // Sort network miners by placement (y then x) within each rack for correct order
        const minersByRack = {}
        for (const m of data.miners) {
          if (!m.placement || !m.placement.user_rack_id) continue
          const rackUid = m.placement.user_rack_id
          if (!minersByRack[rackUid]) minersByRack[rackUid] = []
          minersByRack[rackUid].push(m)
        }
        for (const arr of Object.values(minersByRack)) {
          arr.sort((a, b) => a.placement.y - b.placement.y || a.placement.x - b.placement.x)
        }

        // Place miners: find the slot by _userRackId, match to loadedMiners
        for (const [rackUid, netMiners] of Object.entries(minersByRack)) {
          // Find the slot that has this _userRackId
          let slot = null
          for (const roomNum of [1, 2, 3, 4]) {
            for (const s of Object.values(rooms[roomNum])) {
              if (s._userRackId === rackUid) { slot = s; break }
            }
            if (slot) break
          }
          if (!slot) continue

          for (const nm of netMiners) {
            const netName = (nm.name || '').toLowerCase().trim()
            const netPowerGhs = nm.power || 0

            // Find matching loadedMiner by clean name + closest power
            let bestMatch = null, bestPowerDiff = Infinity
            for (const lm of this.loadedMiners) {
              if (placedUids.has(lm.uid)) continue
              const lmCleanName = this.getCleanName(lm.name).toLowerCase().trim()
              if (lmCleanName !== netName) continue
              const lmPowerGhs = this.parsePowerToGhs(lm.power)
              const diff = Math.abs(lmPowerGhs - netPowerGhs)
              if (diff < bestPowerDiff) { bestPowerDiff = diff; bestMatch = lm }
            }

            if (bestMatch) {
              slot.miners.push(bestMatch)
              placedUids.add(bestMatch.uid)
            }
          }
        }

        this.recordCurrentState()
        this.rooms = rooms
        this.activeRooms = activeRooms
        this.minerImageCache = {}
        this.saveSnapshot()
        this.saveToStorage()

        const placed = placedUids.size
        const total = data.miners.length
        this.autoImportSuccess = `Placed ${placed}/${total} miners in ${data.racks.length} racks`
        setTimeout(() => { this.showAutoImport = null; this.autoImportText = ''; this.autoImportSuccess = '' }, 2000)

      } catch (e) {
        this.autoImportError = 'Error parsing JSON: ' + e.message
      }
    },

    _formatPower(ghs) {
      if (ghs >= 1e12) return `${(ghs / 1e12).toFixed(3)} Zh/s`
      if (ghs >= 1e9) return `${(ghs / 1e9).toFixed(3)} Eh/s`
      if (ghs >= 1e6) return `${(ghs / 1e6).toFixed(3)} Ph/s`
      if (ghs >= 1e3) return `${(ghs / 1e3).toFixed(3)} Th/s`
      return `${ghs.toFixed(3)} Gh/s`
    },

    // ========== STACKED MINER HELPERS ==========
    selectStackedMiner(stacked) {
      if (this._actionJustDone) { this._actionJustDone = false; return }
      if (this.minerRemovalKey || this.minerAddKey) return
      const key = `${stacked.name}|${stacked.power}|${stacked.bonus}`
      const hasSelector = !!this.minerSelectState[key]

      if (hasSelector) {
        // Deselect and close selector
        stacked._instances.forEach(inst => this.$delete(this.manualSelectedMiners, inst.uid))
        this.$delete(this.minerSelectState, key)
      } else if (stacked._stackQty === 1) {
        // Only 1 available, toggle directly
        const selected = this.manualSelectedMiners[stacked._instances[0].uid]
        if (selected) {
          this.$delete(this.manualSelectedMiners, stacked._instances[0].uid)
        } else {
          this.$set(this.manualSelectedMiners, stacked._instances[0].uid, true)
        }
      } else {
        // Multiple available, show qty selector starting at 1
        this.$set(this.minerSelectState, key, { qty: 1, max: stacked._stackQty })
        this.$set(this.manualSelectedMiners, stacked._instances[0].uid, true)
      }
    },
    changeMinerSelectQty(miner, delta) {
      const key = `${miner.name}|${miner.power}|${miner.bonus}`
      const state = this.minerSelectState[key]
      if (!state) return
      const newVal = state.qty + delta
      if (newVal < 1) {
        // Deselect all and close
        const stacked = this.stackedAvailableMiners.find(m => `${m.name}|${m.power}|${m.bonus}` === key)
        if (stacked) stacked._instances.forEach(inst => this.$delete(this.manualSelectedMiners, inst.uid))
        this.$delete(this.minerSelectState, key)
        return
      }
      const qty = Math.min(newVal, state.max)
      this.$set(this.minerSelectState, key, { qty, max: state.max })
      // Apply selection
      const stacked = this.stackedAvailableMiners.find(m => `${m.name}|${m.power}|${m.bonus}` === key)
      if (stacked) {
        stacked._instances.forEach(inst => this.$delete(this.manualSelectedMiners, inst.uid))
        for (let k = 0; k < Math.min(qty, stacked._instances.length); k++) {
          this.$set(this.manualSelectedMiners, stacked._instances[k].uid, true)
        }
      }
    },
    startMinerRemoval(stacked) {
      const key = `${stacked.name}|${stacked.power}|${stacked.bonus}`
      this.minerAddKey = null
      if (this.minerRemovalKey === key) { this.minerRemovalKey = null; return }
      this.minerRemovalKey = key
      this.minerRemovalQty = 1
      this.minerRemovalMax = stacked._stackQty
    },
    onMinerRemovalInput(e) {
      const raw = e.target.value
      if (raw === '' || raw === '-') return
      let val = parseInt(raw)
      if (isNaN(val) || val < 1) { val = 1; e.target.value = val }
      else if (val > this.minerRemovalMax) { val = this.minerRemovalMax; e.target.value = val }
      this.minerRemovalQty = val
    },
    clampMinerRemovalInput(e) {
      let val = parseInt(e.target.value)
      if (isNaN(val) || val < 1) val = 1
      if (val > this.minerRemovalMax) val = this.minerRemovalMax
      this.minerRemovalQty = val
      e.target.value = val
    },
    confirmMinerRemoval() {
      const parts = this.minerRemovalKey.split('|')
      const name = parts[0], power = parts[1], bonus = parts[2]
      let remaining = this.minerRemovalQty
      for (let i = this.loadedMiners.length - 1; i >= 0 && remaining > 0; i--) {
        const m = this.loadedMiners[i]
        if (m.name === name && m.power === power && m.bonus === bonus) {
          this.loadedMiners.splice(i, 1)
          remaining--
        }
      }
      // If no instances of this miner remain, clear its edit from localStorage
      const stillExists = this.loadedMiners.some(m => m.name === name)
      if (!stillExists) {
        const dbMiner = this.findMiner({ name: this.getCleanName(name) })
        if (dbMiner) {
          const edits = JSON.parse(localStorage.getItem('minerEdits') || '{}')
          if (edits[dbMiner.id]) {
            delete edits[dbMiner.id]
            localStorage.setItem('minerEdits', JSON.stringify(edits))
          }
        }
      }
      this.minerRemovalKey = null
      this._actionJustDone = true
      this.minerImageCache = {}
      this.saveToStorage()
    },

    // ========== ADD DUPLICATES ==========
    startMinerAddDuplicate(stacked) {
      const key = `${stacked.name}|${stacked.power}|${stacked.bonus}`
      if (this.minerAddKey === key) { this.minerAddKey = null; return }
      this.minerRemovalKey = null
      this.minerAddKey = key
      this.minerAddQty = 1
    },
    confirmMinerAddDuplicate() {
      const parts = this.minerAddKey.split('|')
      const ref = this.loadedMiners.find(m => m.name === parts[0] && m.power === parts[1] && m.bonus === parts[2])
      if (!ref) { this.minerAddKey = null; return }
      let uidCounter = Date.now()
      for (let i = 0; i < this.minerAddQty; i++) {
        this.loadedMiners.push({ ...ref, uid: uidCounter++ })
      }
      this.minerAddKey = null
      this._actionJustDone = true
      this.minerImageCache = {}
      this.saveToStorage()
    },
    startRackAdd(rack) {
      const key = rack.id || rack.name
      if (this.rackAddId === key) { this.rackAddId = null; return }
      this.rackRemovalId = null
      this.rackAddId = key
      this.rackAddQty = 1
    },
    confirmRackAdd() {
      this._changeRackQty(this.rackAddId, this.rackAddQty)
      this.rackAddId = null
      this._actionJustDone = true
      this.saveToStorage()
    },
    confirmRackRemoval() {
      this._changeRackQty(this.rackRemovalId, -this.rackRemovalQty)
      this.rackRemovalId = null
      this._actionJustDone = true
      this.saveToStorage()
    },
    _changeRackQty(rackKey, delta) {
      const idx = this.userRacks.findIndex(r => (r.id || r.name) === rackKey)
      if (idx !== -1) {
        this.$set(this.userRacks, idx, { ...this.userRacks[idx], quantity: this.userRacks[idx].quantity + delta })
      } else {
        const dbRack = this.racksDefinitions.find(r => (r.id || r.name) === rackKey)
        if (dbRack) {
          this.userRacks.push({ ...dbRack, quantity: delta, addedManually: false })
        }
      }
    },

    // ========== REMOVE MINERS/RACKS ==========
    removeMiner(miner) {
      const idx = this.loadedMiners.findIndex(m => m.uid === miner.uid)
      if (idx !== -1) {
        this.loadedMiners.splice(idx, 1)
        this.minerImageCache = {}
        this.saveToStorage()
      }
    },
    startRackRemoval(rack) {
      const key = rack.id || rack.name
      this.rackAddId = null
      if (this.rackRemovalId === key) { this.rackRemovalId = null; return }
      this.rackRemovalId = key
      this.rackRemovalQty = 1
      this.rackRemovalMax = rack.available
    },
    onRackRemovalInput(e) {
      const raw = e.target.value
      if (raw === '' || raw === '-') return
      let val = parseInt(raw)
      if (isNaN(val) || val < 1) {
        val = 1
        e.target.value = val
      } else if (val > this.rackRemovalMax) {
        val = this.rackRemovalMax
        e.target.value = val
      }
      this.rackRemovalQty = val
    },
    clampRackRemovalInput(e) {
      let val = parseInt(e.target.value)
      if (isNaN(val) || val < 1) val = 1
      if (val > this.rackRemovalMax) val = this.rackRemovalMax
      this.rackRemovalQty = val
      e.target.value = val
    },

    // ========== ADD MODAL ==========
    toggleAddSelect(id) {
      if (this.addModalSelected[id]) {
        this.$delete(this.addModalSelected, id)
      } else {
        this.$set(this.addModalSelected, id, 1)
      }
    },
    changeAddQty(id, delta) {
      const current = this.addModalSelected[id] || 1
      const newVal = current + delta
      if (newVal < 1) {
        this.$delete(this.addModalSelected, id)
      } else {
        this.$set(this.addModalSelected, id, newVal)
      }
    },
    closeAddModal() {
      this.showAddModal = null
      this.addModalSearch = ''
      this.addModalSelected = {}
      this.addModalSortBy = 'power-desc'
      this.showAddSort = false
    },
    confirmAddModal() {
      if (this.showAddModal === 'miners') {
        let uidCounter = Date.now()
        for (const minerId in this.addModalSelected) {
          const qty = this.addModalSelected[minerId]
          const dbMiner = this.miners.find(m => m.id === minerId)
          if (!dbMiner) continue
          // Count how many of this miner already exist
          const currentQty = this.loadedMiners.filter(m => m.minerId === minerId).length
          const toAdd = Math.max(0, qty - currentQty)
          for (let k = 0; k < toAdd; k++) {
            this.loadedMiners.push({
              uid: uidCounter++,
              name: dbMiner.name,
              power: dbMiner.power,
              bonus: dbMiner.bonus,
              isSet: dbMiner.is_set,
              isLegacy: false,
              minerId: dbMiner.id,
              cells: dbMiner.cells || 1,
              setName: (dbMiner.is_set && dbMiner.set) ? dbMiner.set : null,
              source: 'MANUAL',
              addedManually: true
            })
          }
        }
      } else {
        // Racks - add to user racks list, summing if already exists
        for (const rackKey in this.addModalSelected) {
          const qty = this.addModalSelected[rackKey]
          const dbRack = this.racksDefinitions.find(r => (r.id || r.name) === rackKey)
          if (!dbRack) continue
          const matchKey = dbRack.id || dbRack.name
          const existing = this.userRacks.find(r => (r.id || r.name) === matchKey)
          if (existing) {
            existing.quantity += qty
          } else {
            this.userRacks.push({ ...dbRack, quantity: qty, addedManually: true })
          }
        }
      }
      this.minerImageCache = {}
      this.saveToStorage()
      this.closeAddModal()
    },

    clearRooms() {
      this.showClearRoomsConfirm = false
      this.recordCurrentState()
      for (let r = 1; r <= 4; r++) {
        this.$set(this.rooms, r, {})
      }
      this.saveSnapshot()
      this.saveToStorage()
    },

    clearAll() {
      this.showClearConfirm = false
      this.recordCurrentState()
      this.importText = ''
      this.loadedMiners = []
      this.rooms = { 1: {}, 2: {}, 3: {}, 4: {} }
      this.activeRooms = [true, false, false, false]
      this.currentRoom = 1
      this.history = []
      this.historyIndex = -1
      localStorage.removeItem('minerEdits')
      this.saveToStorage()
      this.saveSnapshot()
    },

    // ========== ROOM MANAGEMENT ==========
    selectRoom(roomNum) {
      if (!this.activeRooms[roomNum - 1]) return
      this.slideDirection = roomNum > this.currentRoom ? 'room-slide-right' : 'room-slide-left'
      this.previousRoom = this.currentRoom
      this.currentRoom = roomNum
    },

    onActiveRoomClick(roomNum) {
      if (roomNum === 1) return
      const isActive = this.activeRooms[roomNum - 1]
      if (isActive) {
        this.confirmDeactivateRoom = roomNum
      } else {
        this.$set(this.activeRooms, roomNum - 1, true)
        this.saveToStorage()
      }
    },

    confirmDeactivate() {
      const roomNum = this.confirmDeactivateRoom
      if (roomNum === null) return
      this.recordCurrentState()
      this.$set(this.rooms, roomNum, {})
      this.$set(this.activeRooms, roomNum - 1, false)
      if (this.currentRoom === roomNum) this.currentRoom = 1
      this.confirmDeactivateRoom = null
      this.saveSnapshot()
      this.saveToStorage()
    },

    // ========== RACK/MINER IN ROOM ==========
    // Group cells into pairs of 2 for the grid display
    getPairsForRow(row, rowIdx) {
      const pairs = []
      for (let i = 0; i < row.length; i += 2) {
        const cells = []
        for (let j = 0; j < 2 && (i + j) < row.length; j++) {
          const colIdx = i + j
          const isSlot = row[colIdx]
          const hasRack = isSlot && !!this.getRackInSlot(this.currentRoom, rowIdx, colIdx)
          cells.push({ isSlot, hasRack: isSlot, colIdx })
        }
        pairs.push({ cells })
      }
      return pairs
    },

    getRackInSlot(roomNum, rowIdx, colIdx) {
      const key = this.getSlotDataKey(roomNum, rowIdx, colIdx)
      const slot = this.rooms[roomNum][key]
      return slot ? slot.rack : null
    },

    getRackMiners(roomNum, rowIdx, colIdx) {
      const key = this.getSlotDataKey(roomNum, rowIdx, colIdx)
      const slot = this.rooms[roomNum][key]
      if (!slot) return Array(8).fill({ miner: null, span: 1 })
      const rackSize = slot.rack ? slot.rack.size : 8
      const minersList = slot.miners || []

      // Separate miners by cell size
      const singles = minersList.filter(m => m && (m.cells || 1) === 1)
      const doubles = minersList.filter(m => m && m.cells === 2)

      // Build rows of 2 columns each (4 rows total)
      const result = []
      let sIdx = 0
      let dIdx = 0
      let cellsUsed = 0

      while (cellsUsed < rackSize) {
        const remaining = rackSize - cellsUsed
        if (remaining <= 0) break

        // Try to place a double first if available
        if (dIdx < doubles.length && remaining >= 2) {
          result.push({ miner: doubles[dIdx], span: 2 })
          dIdx++
          cellsUsed += 2
        }
        // Try to place two singles
        else if (sIdx < singles.length) {
          result.push({ miner: singles[sIdx], span: 1 })
          sIdx++
          cellsUsed++
          if (sIdx < singles.length && cellsUsed < rackSize) {
            result.push({ miner: singles[sIdx], span: 1 })
            sIdx++
            cellsUsed++
          } else if (cellsUsed < rackSize) {
            result.push({ miner: null, span: 1 })
            cellsUsed++
          }
        }
        // Fill empty
        else {
          result.push({ miner: null, span: 1 })
          cellsUsed++
          if (cellsUsed < rackSize) {
            result.push({ miner: null, span: 1 })
            cellsUsed++
          }
        }
      }

      return result
    },

    // ========== POWER CALCULATIONS ==========
    parsePowerToGhs(powerStr) {
      if (!powerStr) return 0
      const match = powerStr.match(/([\d.,]+)\s*(Gh\/s|Th\/s|Ph\/s|Eh\/s|Zh\/s)/i)
      if (!match) return 0
      const value = parseFloat(match[1].replace(',', '.'))
      const unit = match[2].toLowerCase()
      if (unit.includes('zh')) return value * 1e12
      if (unit.includes('eh')) return value * 1e9
      if (unit.includes('ph')) return value * 1e6
      if (unit.includes('th')) return value * 1e3
      return value
    },

    formatPower(ghsValue) {
      if (Math.abs(ghsValue) >= 1e12) return `${(ghsValue / 1e12).toFixed(3)} Zh/s`
      if (Math.abs(ghsValue) >= 1e9) return `${(ghsValue / 1e9).toFixed(3)} Eh/s`
      if (Math.abs(ghsValue) >= 1e6) return `${(ghsValue / 1e6).toFixed(3)} Ph/s`
      if (Math.abs(ghsValue) >= 1e3) return `${(ghsValue / 1e3).toFixed(3)} Th/s`
      return `${ghsValue.toFixed(3)} Gh/s`
    },

    // Ratio per cell = (power in Ph/s / bonus) / cells. Lower = more bonus per power per cell.
    minerRatioValue(miner) {
      const bonus = parseFloat(miner.bonus) || 0
      if (bonus <= 0) return Infinity
      const powerPh = this.parsePowerToGhs(miner.power) / 1e6
      return powerPh / bonus / (miner.cells || 1)
    },
    minerRatioLabel(miner) {
      const r = this.minerRatioValue(miner)
      if (!isFinite(r)) return '—'
      return r < 10 ? r.toFixed(3) : r.toFixed(1)
    },

    // ========== SELLABLE / FILTER ==========
    isMinerSellable(miner) {
      const dbMiner = this.findMiner(miner)
      return !!(dbMiner && dbMiner.can_be_sold)
    },
    // Resolve the marketplace sell ID for the miner's actual rarity/merge level.
    // Base miners (no rarity prefix) use the base miner id; merged miners use the
    // merge_id of their level from merges.json (level 2=Uncommon ... 6=Unreal).
    // The merges entry is resolved by BASE id (via findMiner) so name mismatches
    // (apostrophes, parentheses, unicode) don't fall back to the base id wrongly.
    resolveMergeId(miner) {
      const rarityLevel = this.getRarityLevel(miner.name)
      if (!rarityLevel || rarityLevel === 'legacy') return null
      const dbMiner = this.findMiner(miner)
      let entry = dbMiner && dbMiner.id ? this.mergesByBaseId[dbMiner.id] : null
      if (!entry) entry = this.mergesNameMap[this.normalizeName(this.getCleanName(miner.name))]
      if (!entry && dbMiner) entry = this.mergesNameMap[this.normalizeName(dbMiner.name)]
      if (!entry || !entry.merges) return null
      const merge = entry.merges.find(mg => mg.level === rarityLevel)
      return merge ? merge.merge_id : null
    },
    getMinerSellLink(miner) {
      const mergeId = this.resolveMergeId(miner)
      const dbMiner = this.findMiner(miner)
      const id = mergeId || (dbMiner && dbMiner.id) || miner.minerId
      return id ? `https://rollercoin.com/marketplace/sell/miner/${id}` : 'https://rollercoin.com/marketplace'
    },
    toggleMinerFilter() {
      this.showMinerFilter = !this.showMinerFilter
      if (this.showMinerFilter) this.showMinerSort = false
    },
    resetMinerFilter() {
      this.minerFilterSellable = 'all'
      this.minerFilterPowerMin = null
      this.minerFilterPowerMax = null
      this.minerFilterBonusMin = null
      this.minerFilterBonusMax = null
    },
    onPowerMinInput(e) {
      const { min } = this.minerPowerBounds
      let v = parseFloat(e.target.value)
      if (isNaN(v)) return
      v = Math.max(min, Math.min(v, this.powerMaxVal))
      this.minerFilterPowerMin = v
    },
    onPowerMaxInput(e) {
      const { max } = this.minerPowerBounds
      let v = parseFloat(e.target.value)
      if (isNaN(v)) return
      v = Math.min(max, Math.max(v, this.powerMinVal))
      this.minerFilterPowerMax = v
    },
    onBonusMinInput(e) {
      const { min } = this.minerBonusBounds
      let v = parseFloat(e.target.value)
      if (isNaN(v)) return
      v = Math.max(min, Math.min(v, this.bonusMaxVal))
      this.minerFilterBonusMin = v
    },
    onBonusMaxInput(e) {
      const { max } = this.minerBonusBounds
      let v = parseFloat(e.target.value)
      if (isNaN(v)) return
      v = Math.min(max, Math.max(v, this.bonusMinVal))
      this.minerFilterBonusMax = v
    },

    // ========== SET BONUS CALCULATION ==========
    // Get the set name for a loaded miner
    // Checks clean name against sets.json miners lists, respecting rarity requirements
    getMinerSetName(miner) {
      if (!miner) return null
      const cleanName = this.getCleanName(miner.name)
      const minerRarity = this.getRarityLevel(miner.name)
      const rarityNames = { 2: 'Uncommon', 3: 'Rare', 4: 'Epic', 5: 'Legendary', 6: 'Unreal' }
      const minerRarityName = rarityNames[minerRarity] || null

      for (const setDef of this.setsDefinitions) {
        if (!setDef.miners) continue
        for (const entry of setDef.miners) {
          if (typeof entry === 'string') {
            // Any rarity accepted
            if (entry === cleanName) return setDef.name
          } else if (entry.name === cleanName) {
            // Specific rarity required
            if (!entry.rarity) return setDef.name
            if (entry.rarity === minerRarityName) return setDef.name
            // Base/common: rarity is null, entry.rarity would need to be null too
            if (!entry.rarity && !minerRarityName) return setDef.name
          }
        }
      }
      // Fallback: stored setName — but only if it passes rarity check
      if (miner.setName) {
        const setDef = this.setsDefinitions.find(s => s.name === miner.setName)
        if (setDef && setDef.miners) {
          // Set has explicit miners list — must match (already checked above, didn't match)
          return null
        }
        return miner.setName
      }
      // Fallback: database lookup — same rarity guard
      const dbMiner = this.findMiner(miner)
      if (dbMiner && dbMiner.is_set && dbMiner.set) {
        const setDef = this.setsDefinitions.find(s => s.name === dbMiner.set)
        if (setDef && setDef.miners) return null
        return dbMiner.set
      }
      return null
    },

    // Get ALL achieved set level bonuses for a rack slot
    // Returns array of { type: 'bonus'|'power', value: number } or empty
    getSlotSetBonuses(slot) {
      if (!slot || !slot.rack || !slot.rack.is_set || !slot.rack.set) return []
      const setName = slot.rack.set
      const setDef = this.setsDefinitions.find(s => s.name === setName)
      if (!setDef || !setDef.levels || setDef.levels.length === 0) return []

      let setMinerCount = 0
      if (slot.miners) {
        slot.miners.forEach(m => {
          if (m && this.getMinerSetName(m) === setName) setMinerCount++
        })
      }

      if (setMinerCount === 0) return []

      // All levels where requirement is met (cumulative)
      return setDef.levels
        .filter(lvl => setMinerCount >= lvl.required)
        .map(lvl => ({ type: lvl.bonus_type, value: lvl.bonus_value }))
    },

    // Compat wrapper used in computeds
    getSlotSetBonus(slot) {
      const bonuses = this.getSlotSetBonuses(slot)
      if (bonuses.length === 0) return null
      // Sum all bonuses by type
      let bonusTotal = 0, powerTotal = 0
      for (const b of bonuses) {
        if (b.type === 'bonus') bonusTotal += b.value
        else if (b.type === 'power') powerTotal += b.value
      }
      // Return combined - callers check type
      if (bonusTotal > 0 && powerTotal > 0) return { type: 'mixed', bonus: bonusTotal, power: powerTotal }
      if (bonusTotal > 0) return { type: 'bonus', value: bonusTotal }
      if (powerTotal > 0) return { type: 'power', value: powerTotal }
      return null
    },

    // ========== AUTO FILL ==========
    // Set definitions lookup (cached)
    _getSetMap() {
      if (!this._setMapCache) {
        this._setMapCache = {}
        for (const s of this.setsDefinitions) this._setMapCache[s.name] = s
      }
      return this._setMapCache
    },

    _topCandidates(miners, n) {
      const byPower = [...miners].sort((a, b) => b.power - a.power).slice(0, n)
      const byBonus = [...miners].sort((a, b) => b.bonus - a.bonus).slice(0, n)
      const seen = new Set()
      const result = []
      for (const c of [...byPower, ...byBonus]) {
        const uid = c.miner.uid
        if (!seen.has(uid)) { seen.add(uid); result.push(c) }
      }
      return result
    },
    _dedupByName(miners) {
      const seen = new Set()
      const result = []
      for (const m of miners) {
        const name = m.miner ? m.miner.name : null
        if (name && seen.has(name)) continue
        if (name) seen.add(name)
        result.push(m)
      }
      return result
    },

    // Calculate full EP stats from rack assignments
    // Duplicate miners (same name) only contribute bonus ONCE
    _calcFullPowerStats(assignments) {
      const setMap = this._getSetMap()
      let rawTotal = 0, bonusTotal = 0, rackExtra = 0, setPowerExtra = 0
      const seenBonus = new Set()
      for (let i = 0; i < assignments.length; i++) {
        const ra = assignments[i]
        let slotRaw = 0
        for (let j = 0; j < ra.miners.length; j++) {
          const m = ra.miners[j]
          rawTotal += m.power
          const mRef = m.miner || m
          const dedupKey = `${mRef.name}|${mRef.power}|${mRef.bonus}`
          if (!seenBonus.has(dedupKey)) {
            seenBonus.add(dedupKey)
            bonusTotal += m.bonus
          }
          slotRaw += m.power
        }
        if (ra.rackBonus) rackExtra += slotRaw * ra.rackBonus / 100
        if (ra.setName) {
          const setDef = setMap[ra.setName]
          if (setDef) {
            let cnt = 0
            for (let j = 0; j < ra.miners.length; j++) {
              if (ra.miners[j]._effectiveSet === ra.setName) cnt++
            }
            if (cnt > 0) {
              for (let k = 0; k < setDef.levels.length; k++) {
                const lvl = setDef.levels[k]
                if (cnt >= lvl.required) {
                  if (lvl.bonus_type === 'bonus') bonusTotal += lvl.bonus_value
                  else setPowerExtra += lvl.bonus_value
                }
              }
            }
          }
        }
      }
      const ep = rawTotal * (1 + bonusTotal / 100) + rackExtra + setPowerExtra
      return { ep, rawPower: rawTotal, bonusTotal }
    },

    _calcFullPower(assignments) {
      return this._calcFullPowerStats(assignments).ep
    },

    // Build rack assignment and calculate EP
    _buildRackAssignment(racks, miners) {
      const assignments = new Array(racks.length)
      const setIdxs = []
      for (let i = 0; i < racks.length; i++) {
        const r = racks[i]
        assignments[i] = { rackBonus: r.bonus || 0, setName: (r.is_set && r.set) || null, size: r.size, miners: [], used: 0 }
        if (assignments[i].setName) setIdxs.push(i)
      }

      const used = new Set()
      const setMap = this._getSetMap()

      // Count set miners available per set (using precomputed _effectiveSet)
      const setMinerCounts = {}
      for (let j = 0; j < miners.length; j++) {
        const es = miners[j]._effectiveSet
        if (es) setMinerCounts[es] = (setMinerCounts[es] || 0) + 1
      }

      // Pass 1: set miners into matching set racks — only if enough to activate a level
      for (const idx of setIdxs) {
        const ra = assignments[idx]
        const setDef = setMap[ra.setName]
        const minRequired = setDef && setDef.levels.length > 0
          ? Math.min(...setDef.levels.map(l => l.required))
          : Infinity
        if ((setMinerCounts[ra.setName] || 0) < minRequired) continue

        for (let j = 0; j < miners.length; j++) {
          const m = miners[j]
          if (used.has(j) || m._effectiveSet !== ra.setName || ra.used + m.cells > ra.size) continue
          ra.miners.push(m); used.add(j); ra.used += m.cells
        }
      }

      // Pass 2: remaining miners sorted by power/cell desc into highest bonus racks
      const sortedIdxs = []
      for (let i = 0; i < assignments.length; i++) sortedIdxs.push(i)
      sortedIdxs.sort((a, b) => assignments[b].rackBonus - assignments[a].rackBonus)

      const remainingJs = []
      for (let j = 0; j < miners.length; j++) {
        if (!used.has(j)) remainingJs.push(j)
      }
      remainingJs.sort((a, b) => (miners[b].power / miners[b].cells) - (miners[a].power / miners[a].cells))

      for (const j of remainingJs) {
        const m = miners[j]
        for (const idx of sortedIdxs) {
          const ra = assignments[idx]
          if (ra.used + m.cells <= ra.size) {
            ra.miners.push(m); used.add(j); ra.used += m.cells; break
          }
        }
      }

      const stats = this._calcFullPowerStats(assignments)
      return { assignments, ep: stats.ep, rawPower: stats.rawPower, bonusTotal: stats.bonusTotal }
    },

    // Fast EP estimate without full rack assignment
    _fastEP(selected) {
      let R = 0, B = 0
      for (let i = 0; i < selected.length; i++) { R += selected[i].power; B += selected[i].bonus }
      return R * (1 + B / 100)
    },

    // Select miners greedily
    _greedySelectWithRacks(minerData, rackConfigs, maxPowerGhs, sortFn) {
      const sorted = [...minerData].sort(sortFn)
      const selected = []
      let totalCells = 0
      const maxCells = rackConfigs.reduce((s, r) => s + r.size, 0)

      if (maxPowerGhs === null) {
        for (const m of sorted) {
          if (totalCells + m.cells <= maxCells) { selected.push(m); totalCells += m.cells }
        }
      } else {
        for (const m of sorted) {
          if (totalCells + m.cells > maxCells) continue
          selected.push(m)
          totalCells += m.cells
          // Always verify with full calc (includes rack bonus + set bonus)
          if (this._buildRackAssignment(rackConfigs, selected).ep > maxPowerGhs) {
            selected.pop(); totalCells -= m.cells
          }
        }
      }

      return { selected, ep: this._buildRackAssignment(rackConfigs, selected).ep }
    },

    // Maximize raw power within EP limit by exploiting duplicates
    // Duplicates only count bonus once, so filling slots with copies = max raw power per EP
    _greedyMaxRawPower(minerData, rackConfigs, maxPowerGhs) {
      const maxCells = rackConfigs.reduce((s, r) => s + r.size, 0)
      if (!maxPowerGhs) return this._greedySelectWithRacks(minerData, rackConfigs, null, (a, b) => b.power - a.power)

      // Group miners by name
      const groups = {}
      for (const m of minerData) {
        const key = m.miner.name
        if (!groups[key]) groups[key] = { miners: [], power: m.power, bonus: m.bonus, cells: m.cells }
        groups[key].miners.push(m)
      }

      let bestSelected = null, bestRaw = -1

      // Strategy A: for each group with 2+ copies, try filling mostly with that group.
      // Only try the top-N highest-power duplicate groups: those maximize raw power,
      // and trying every duplicate group is O(#groups x M) which blows up with many miners.
      const dupeKeys = Object.keys(groups)
        .filter(k => groups[k].miners.length >= 2)
        .sort((a, b) => groups[b].power - groups[a].power)
        .slice(0, 12)
      for (const key of dupeKeys) {
        const g = groups[key]

        const selected = []
        let totalCells = 0

        // Fill with copies of this miner first
        for (const m of g.miners) {
          if (totalCells + m.cells > maxCells) continue
          selected.push(m)
          totalCells += m.cells
        }

        // Check if within EP limit, remove from end if over
        while (selected.length > 0) {
          const ep = this._buildRackAssignment(rackConfigs, selected).ep
          if (ep <= maxPowerGhs) break
          selected.pop()
          totalCells -= g.cells
        }

        // Fill remaining cells with other miners — prioritize duplicates of names already selected
        const usedUids = new Set(selected.map(m => m.miner.uid))
        const selNames = new Set(selected.map(m => m.miner.name))
        const rest = minerData.filter(m => !usedUids.has(m.miner.uid))
        // Sort: dupes of selected names first (no bonus cost), then by power desc
        rest.sort((a, b) => {
          const aDupe = selNames.has(a.miner.name) ? 1 : 0
          const bDupe = selNames.has(b.miner.name) ? 1 : 0
          if (bDupe !== aDupe) return bDupe - aDupe
          return b.power - a.power
        })
        for (const m of rest) {
          if (totalCells + m.cells > maxCells) continue
          selected.push(m)
          totalCells += m.cells
          selNames.add(m.miner.name)
          if (this._buildRackAssignment(rackConfigs, selected).ep > maxPowerGhs) {
            selected.pop()
            totalCells -= m.cells
          }
        }

        const stats = this._buildRackAssignment(rackConfigs, selected)
        if (stats.rawPower > bestRaw) {
          bestRaw = stats.rawPower
          bestSelected = [...selected]
        }
      }

      // Strategy B: mix approach — sort all miners by power/bonus ratio (high power, low bonus = good)
      // Then greedy fill, but when a miner is rejected (EP too high), skip to next
      {
        // Sort by: duplicates first (0 marginal bonus), then by power desc
        const nameCount = {}
        for (const m of minerData) nameCount[m.miner.name] = (nameCount[m.miner.name] || 0) + 1
        const sorted = [...minerData].sort((a, b) => {
          // Miners with more copies = better (more dupes available)
          const aMulti = nameCount[a.miner.name] > 1 ? 1 : 0
          const bMulti = nameCount[b.miner.name] > 1 ? 1 : 0
          if (bMulti !== aMulti) return bMulti - aMulti
          // Among same category, higher power first
          return b.power - a.power
        })

        const selected = []
        let totalCells = 0
        for (const m of sorted) {
          if (totalCells + m.cells > maxCells) continue
          selected.push(m)
          totalCells += m.cells
          if (this._buildRackAssignment(rackConfigs, selected).ep > maxPowerGhs) {
            selected.pop()
            totalCells -= m.cells
          }
        }
        const stats = this._buildRackAssignment(rackConfigs, selected)
        if (stats.rawPower > bestRaw) {
          bestRaw = stats.rawPower
          bestSelected = [...selected]
        }
      }

      if (!bestSelected || bestSelected.length === 0) {
        return this._greedySelectWithRacks(minerData, rackConfigs, maxPowerGhs, (a, b) => b.power - a.power)
      }

      return { selected: bestSelected, ep: this._buildRackAssignment(rackConfigs, bestSelected).ep }
    },

    // Exact max raw power via knapsack DP over cells (miner weights are 1 or 2).
    // Raw power ignores bonus, so maximizing it is a pure knapsack: maximize sum(power)
    // subject to sum(cells) <= maxCells. Greedy strategies leave cells poorly packed;
    // this finds the true optimum for the (common) non-binding EP-cap case.
    _knapsackMaxRawPower(minerData, rackConfigs, maxPowerGhs) {
      const maxCells = rackConfigs.reduce((s, r) => s + r.size, 0)
      if (maxCells <= 0) return { selected: [], ep: 0 }

      // Candidates: an optimal fill uses only the highest-power miners. Keep enough of
      // each cell-class (incl. 1-cell miners to pack odd leftover cells).
      const ones = minerData.filter(m => (m.cells || 1) === 1).sort((a, b) => b.power - a.power).slice(0, maxCells)
      const multi = minerData.filter(m => (m.cells || 1) >= 2).sort((a, b) => b.power - a.power).slice(0, maxCells)
      const items = ones.concat(multi)

      // 0/1 knapsack: dp[c] = max total power using <= c cells
      const dpPower = new Array(maxCells + 1).fill(0)
      const dpItems = new Array(maxCells + 1).fill(null).map(() => [])
      for (const it of items) {
        const w = it.cells || 1
        for (let c = maxCells; c >= w; c--) {
          const cand = dpPower[c - w] + it.power
          if (cand > dpPower[c]) {
            dpPower[c] = cand
            dpItems[c] = dpItems[c - w].concat(it)
          }
        }
      }
      let bestC = 0
      for (let c = 1; c <= maxCells; c++) if (dpPower[c] > dpPower[bestC]) bestC = c
      let selected = dpItems[bestC].slice()

      // Enforce EP cap if it actually binds (strip lowest-power miners)
      if (maxPowerGhs !== null) {
        while (selected.length > 0 && this._buildRackAssignment(rackConfigs, selected).ep > maxPowerGhs) {
          let wi = 0
          for (let i = 1; i < selected.length; i++) if (selected[i].power < selected[wi].power) wi = i
          selected.splice(wi, 1)
        }
      }
      return { selected, ep: this._buildRackAssignment(rackConfigs, selected).ep }
    },

    // Marginal-ratio greedy: at each step pick the miner with the best gain-per-EP-cost.
    // EP = rawPower x (1 + sum(distinct bonus)/100), so bonus counts ONCE per name and
    // duplicates are almost free. This dynamically favors high-power/low-bonus miners (and
    // their duplicates) for power priority, and high-bonus/low-power for bonus priority,
    // which is exactly how to pack the most raw (or bonus) under the EP cap.
    // Uses a fast incremental EP estimate (ignores rack/set bonus) for candidate scoring;
    // the real EP is validated afterwards by the caller (step 5b) and _isBetter.
    _greedyMarginalRatio(minerData, rackConfigs, maxPowerGhs, priority) {
      const maxCells = rackConfigs.reduce((s, r) => s + r.size, 0)
      const remaining = [...minerData]
      const selected = []
      let totalCells = 0
      let curRaw = 0, curBonus = 0
      const nameCounts = {}

      while (totalCells < maxCells && remaining.length > 0) {
        const curEP = curRaw * (1 + curBonus / 100)
        let bestI = -1, bestScore = -Infinity
        const nameSeen = new Set()
        for (let i = 0; i < remaining.length; i++) {
          const m = remaining[i]
          const name = m.miner.name
          if (nameSeen.has(name)) continue
          nameSeen.add(name)
          if (totalCells + m.cells > maxCells) continue
          const isDup = nameCounts[name] > 0
          const newRaw = curRaw + m.power
          const newBonus = curBonus + (isDup ? 0 : m.bonus)
          const newEP = newRaw * (1 + newBonus / 100)
          if (maxPowerGhs !== null && newEP > maxPowerGhs) continue
          const marginalEP = Math.max(newEP - curEP, 1e-6)
          const gain = priority === 'bonus' ? (isDup ? 0 : m.bonus) : m.power
          const score = gain / marginalEP / m.cells
          if (score > bestScore) { bestScore = score; bestI = i }
        }
        if (bestI === -1) break
        const m = remaining.splice(bestI, 1)[0]
        selected.push(m)
        totalCells += m.cells
        if (!(nameCounts[m.miner.name] > 0)) curBonus += m.bonus
        curRaw += m.power
        nameCounts[m.miner.name] = (nameCounts[m.miner.name] || 0) + 1
      }
      return { selected, ep: this._buildRackAssignment(rackConfigs, selected).ep }
    },

    // Max raw power under the EP cap, modeling the real structure:
    // EP = rawPower x (1 + sum(distinct bonus)/100). Duplicates add raw with ZERO extra
    // bonus, so the optimum activates a set of distinct miners (paying their bonus once)
    // then fills every cell with the highest-power copies that keep raw <= cap/(1+B/100).
    // We grow the distinct set under several orderings (incl. bonus-ascending) and keep the
    // best fill found. Rack/set bonus is ignored here (validated later by _buildRackAssignment).
    _maxRawUnderEP(minerData, rackConfigs, maxPowerGhs) {
      const maxCells = rackConfigs.reduce((s, r) => s + r.size, 0)
      if (!maxPowerGhs || maxCells <= 0) {
        return this._greedySelectWithRacks(minerData, rackConfigs, maxPowerGhs, (a, b) => b.power - a.power)
      }
      const groups = {}
      for (const m of minerData) {
        const k = m.miner.name
        if (!groups[k]) groups[k] = { power: m.power, bonus: m.bonus, cells: m.cells, items: [] }
        groups[k].items.push(m)
      }
      const distinct = Object.values(groups)
      const orderings = [
        (a, b) => (b.power / b.cells) - (a.power / a.cells),
        (a, b) => b.power - a.power,
        (a, b) => (a.bonus - b.bonus) || (b.power - a.power),
        (a, b) => (b.power / (b.bonus + 1)) - (a.power / (a.bonus + 1))
      ]
      let bestRaw = -1, bestSel = []
      for (const ord of orderings) {
        const sorted = [...distinct].sort(ord)
        const D = []
        let B = 0
        for (const g of sorted) {
          D.push(g)
          B += g.bonus
          const budget = maxPowerGhs / (1 + B / 100)
          const fillGroups = D.slice().sort((a, b) => b.power - a.power)
          let raw = 0, cells = 0
          const sel = []
          for (const x of fillGroups) {
            if (cells >= maxCells) break
            for (let i = 0; i < x.items.length; i++) {
              if (cells + x.cells > maxCells) break
              if (raw + x.power > budget + 1e-6) break
              sel.push(x.items[i]); raw += x.power; cells += x.cells
            }
          }
          if (raw > bestRaw) { bestRaw = raw; bestSel = sel }
        }
      }
      return { selected: bestSel, ep: this._buildRackAssignment(rackConfigs, bestSel).ep }
    },

    // Max total BONUS under the EP cap. The binding constraint here is EP (raw x (1 + B/100)),
    // NOT cells, so to maximize the bonus SUM we spend the EP budget on the HIGHEST-bonus distinct
    // miners (a "power/bonus" ratio instead fills every cell with tiny low-bonus miners and wastes
    // the EP budget). Sets are committed first (their level bonus is free), then distinct miners
    // are added highest-bonus-first until the EP cap; a few orderings are tried and the best kept.
    _maxBonusUnderEP(minerData, rackConfigs, maxPowerGhs) {
      const maxCells = rackConfigs.reduce((s, r) => s + r.size, 0)
      if (maxCells <= 0) return { selected: [], ep: 0 }
      const setMap = this._getSetMap()

      // --- Commit each completable, bonus-giving set (complete-or-skip, never half a set) ---
      const setRacksByName = {}
      for (const r of rackConfigs) {
        if (r.is_set && r.set) (setRacksByName[r.set] = setRacksByName[r.set] || []).push(r)
      }
      const committed = []
      const committedUids = new Set()
      const committedNames = new Set()
      for (const setName of Object.keys(setRacksByName)) {
        const setDef = setMap[setName]
        if (!setDef || !setDef.levels || setDef.levels.length === 0) continue
        const rackCells = setRacksByName[setName].reduce((s, r) => s + r.size, 0)
        const minReq = Math.min(...setDef.levels.map(l => l.required))
        const cand = minerData.filter(m => m._effectiveSet === setName).sort((a, b) => (b.bonus - a.bonus) || (a.power - b.power))
        const fit = []
        let fc = 0
        for (const m of cand) { if (fc + m.cells > rackCells) continue; fit.push(m); fc += m.cells }
        if (fit.length < minReq) continue
        let lvlBonus = 0
        for (const lvl of setDef.levels) {
          if (fit.length >= lvl.required && lvl.bonus_type === 'bonus') lvlBonus += lvl.bonus_value
        }
        if (lvlBonus <= 0) continue // only sets that actually give bonus
        for (const m of fit) { committed.push(m); committedUids.add(m.miner.uid); committedNames.add(m.miner.name) }
      }

      const base = this._buildRackAssignment(rackConfigs, committed)
      const baseExtra = base.ep - base.rawPower * (1 + base.bonusTotal / 100)
      const committedCells = committed.reduce((s, m) => s + m.cells, 0)

      // --- Distinct remaining miners (one representative per name, lowest power = cheapest EP) ---
      const byName = {}
      for (const m of minerData) {
        if (committedNames.has(m.miner.name) || !(m.bonus > 0)) continue
        const k = m.miner.name
        if (!byName[k] || m.power < byName[k].power) byName[k] = m
      }
      const distinct = Object.values(byName)

      // This is a 2-constraint knapsack (cells AND multiplicative EP). Max bonus needs BOTH used:
      // a pure bonus-desc sort burns the EP budget on a few huge-power miners; a pure EP-efficiency
      // (bonus/marginalEP) sort fills every cell with tiny miners and wastes the EP budget. From the
      // Lagrangian of raw*(1+B/100) <= cap, the OPTIMAL ordering is bonus/power ratio descending
      // (include miners whose bonus/power beats a threshold) - that minimizes raw for a given bonus.
      // We try that plus a lambda sweep and bonus/cells / bonus-desc, filling each under cells + EP,
      // and keep the highest total bonus. A final local improvement pass swaps in any unselected
      // miner that raises the bonus while still fitting, to use up leftover EP/cells.
      let bestBonus = base.bonusTotal, bestSel = committed.slice()
      const fillBy = (cmp) => {
        const sorted = [...distinct].sort(cmp)
        let raw = base.rawPower, B = base.bonusTotal, cells = committedCells
        const sel = committed.slice()
        for (const m of sorted) {
          if (cells + m.cells > maxCells) continue
          const newEP = (raw + m.power) * (1 + (B + m.bonus) / 100) + baseExtra
          if (maxPowerGhs !== null && newEP > maxPowerGhs + 1e-6) continue
          sel.push(m); raw += m.power; B += m.bonus; cells += m.cells
        }
        if (B > bestBonus) { bestBonus = B; bestSel = sel.slice() }
      }
      // Optimal-ordering candidate: bonus/power ratio descending.
      fillBy((a, b) => (b.bonus / b.power) - (a.bonus / a.power))
      // Cell-efficiency and raw bonus orderings (win when cells, not EP, bind).
      fillBy((a, b) => (b.bonus / b.cells) - (a.bonus / a.cells))
      fillBy((a, b) => b.bonus - a.bonus)
      // Lagrangian sweep: score = bonus - lambda * power(Ph), spanning keep-huge .. drop-huge.
      const lambdas = [0, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.35, 0.5, 0.75, 1, 1.5, 2, 3, 5, 8, 12, 20, 35, 60, 100]
      for (const lam of lambdas) {
        fillBy((a, b) => (b.bonus - lam * b.power / 1e6) - (a.bonus - lam * a.power / 1e6))
      }
      // Minimum-bonus-threshold sweep (efficient-first, i.e. ratio = power/bonus/cell ascending).
      // Filling by pure efficiency wastes the limited cells on tiny low-bonus miners and leaves the
      // EP budget unused; requiring bonus >= T forces bigger-bonus miners into the cells so the EP
      // cap is actually reached. Two phases per T: first the filtered (bonus >= T) miners by
      // efficiency, then relax the filter to fill any leftover cells with what is left.
      const byRatio = [...distinct].sort((a, b) => (a.power / a.bonus / a.cells) - (b.power / b.bonus / b.cells))
      const thresholds = [0, 0.5, 1, 2, 3, 5, 8, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100]
      for (const T of thresholds) {
        let raw = base.rawPower, B = base.bonusTotal, cells = committedCells
        const sel = committed.slice()
        const tryAdd = (m) => {
          if (cells + m.cells > maxCells) return
          const newEP = (raw + m.power) * (1 + (B + m.bonus) / 100) + baseExtra
          if (maxPowerGhs !== null && newEP > maxPowerGhs + 1e-6) return
          sel.push(m); raw += m.power; B += m.bonus; cells += m.cells
        }
        for (const m of byRatio) if (m.bonus >= T) tryAdd(m) // phase 1: filtered, efficient-first
        for (const m of byRatio) if (m.bonus < T) tryAdd(m)  // phase 2: relax to fill leftover cells
        if (B > bestBonus) { bestBonus = B; bestSel = sel.slice() }
      }
      // Local improvement: greedily add any still-unselected distinct miner that fits under both
      // constraints (a fixed sort can skip a small high-bonus miner after a big one filled the EP).
      {
        const inSel = new Set(bestSel.map(m => m.miner.uid))
        let raw = base.rawPower, B = base.bonusTotal, cells = bestSel.reduce((s, m) => s + m.cells, 0)
        // recompute raw/B from bestSel so the pass is exact
        raw = base.rawPower + bestSel.filter(m => !committedUids.has(m.miner.uid)).reduce((s, m) => s + m.power, 0)
        B = base.bonusTotal + bestSel.filter(m => !committedUids.has(m.miner.uid)).reduce((s, m) => s + m.bonus, 0)
        const rest = distinct.filter(m => !inSel.has(m.miner.uid)).sort((a, b) => (b.bonus / b.power) - (a.bonus / a.power))
        let improved = true
        while (improved) {
          improved = false
          for (const m of rest) {
            if (inSel.has(m.miner.uid)) continue
            if (cells + m.cells > maxCells) continue
            const newEP = (raw + m.power) * (1 + (B + m.bonus) / 100) + baseExtra
            if (maxPowerGhs !== null && newEP > maxPowerGhs + 1e-6) continue
            bestSel.push(m); inSel.add(m.miner.uid); raw += m.power; B += m.bonus; cells += m.cells
            improved = true
          }
        }
      }
      return { selected: bestSel, ep: this._buildRackAssignment(rackConfigs, bestSel).ep }
    },

    // Marginal greedy (limited candidates per step for performance)
    _greedyMarginalWithRacks(minerData, rackConfigs, maxPowerGhs) {
      const remaining = [...minerData]
      const selected = []
      let totalCells = 0
      const maxCells = rackConfigs.reduce((s, r) => s + r.size, 0)
      let currentEP = 0

      while (remaining.length > 0 && totalCells < maxCells) {
        // Evaluate ONE candidate per unique miner name (duplicates give identical results)
        const evalIndices = []
        const nameSeen = new Set()
        for (let i = 0; i < remaining.length; i++) {
          const name = remaining[i].miner ? remaining[i].miner.name : null
          if (name && nameSeen.has(name)) continue
          if (name) nameSeen.add(name)
          evalIndices.push(i)
        }

        let bestIdx = -1, bestEP = currentEP

        for (const i of evalIndices) {
          const m = remaining[i]
          if (totalCells + m.cells > maxCells) continue
          selected.push(m)
          const ep = this._buildRackAssignment(rackConfigs, selected).ep
          selected.pop()
          if (maxPowerGhs !== null && ep > maxPowerGhs) continue
          if (ep > bestEP) { bestEP = ep; bestIdx = i }
        }

        if (bestIdx === -1) break
        selected.push(remaining.splice(bestIdx, 1)[0])
        totalCells += selected[selected.length - 1].cells
        currentEP = bestEP
      }

      return { selected, ep: currentEP }
    },

    // Strategy that pre-commits set miners as groups before greedy fill
    _greedyWithSetCommit(minerData, rackConfigs, maxPowerGhs) {
      const setRacks = rackConfigs.filter(r => r.is_set && r.set)
      if (setRacks.length === 0) return { selected: [], ep: 0 }

      const maxCells = rackConfigs.reduce((s, r) => s + r.size, 0)
      const results = []

      // Try committing set miners for each set rack, respecting power limit
      const committed = []
      const committedSet = new Set()
      let committedCells = 0

      for (const sr of setRacks) {
        const setName = sr.set
        const candidates = minerData
          .filter(m => m._effectiveSet === setName && !committedSet.has(m))
          .sort((a, b) => (b.power + b.bonus) - (a.power + a.bonus))

        let rackCells = 0
        for (const c of candidates) {
          if (rackCells + c.cells <= sr.size) {
            committed.push(c)
            committedSet.add(c)
            rackCells += c.cells
            committedCells += c.cells
            // Check if committed set alone already exceeds limit
            if (maxPowerGhs !== null && this._buildRackAssignment(rackConfigs, committed).ep > maxPowerGhs) {
              committed.pop()
              committedSet.delete(c)
              rackCells -= c.cells
              committedCells -= c.cells
            }
          }
        }
      }

      if (committed.length === 0) return { selected: [], ep: 0 }

      // Fill remaining space with multiple strategies
      const remaining = minerData.filter(m => !committedSet.has(m))
      const sortStrategies = [
        (a, b) => b.iep - a.iep,
        (a, b) => b.power - a.power,
        (a, b) => b.bonus - a.bonus,
        (a, b) => (b.iep / b.cells) - (a.iep / a.cells)
      ]

      for (const sortFn of sortStrategies) {
        const selected = [...committed]
        let totalCells = committedCells
        const sorted = [...remaining].sort(sortFn)

        for (const m of sorted) {
          if (totalCells + m.cells > maxCells) continue
          selected.push(m)
          totalCells += m.cells
          if (maxPowerGhs !== null && this._buildRackAssignment(rackConfigs, selected).ep > maxPowerGhs) {
            selected.pop(); totalCells -= m.cells
          }
        }

        const { ep } = this._buildRackAssignment(rackConfigs, selected)
        results.push({ selected, ep })
      }

      // Also try marginal greedy after commit
      const marginalSelected = [...committed]
      let marginalCells = committedCells
      const marginalRemaining = [...remaining]
      let currentEP = this._buildRackAssignment(rackConfigs, marginalSelected).ep

      while (marginalRemaining.length > 0 && marginalCells < maxCells) {
        marginalRemaining.sort((a, b) => b.iep - a.iep)
        let bestIdx = -1, bestEP = currentEP
        const evalIndicesM = []
        const nameSeenM = new Set()
        for (let i = 0; i < marginalRemaining.length && evalIndicesM.length < 25; i++) {
          const name = marginalRemaining[i].miner ? marginalRemaining[i].miner.name : null
          if (name && nameSeenM.has(name)) continue
          if (name) nameSeenM.add(name)
          evalIndicesM.push(i)
        }
        for (const i of evalIndicesM) {
          const m = marginalRemaining[i]
          if (marginalCells + m.cells > maxCells) continue
          marginalSelected.push(m)
          const { ep } = this._buildRackAssignment(rackConfigs, marginalSelected)
          marginalSelected.pop()
          if (maxPowerGhs !== null && ep > maxPowerGhs) continue
          if (ep > bestEP) { bestEP = ep; bestIdx = i }
        }
        if (bestIdx === -1) break
        marginalSelected.push(marginalRemaining.splice(bestIdx, 1)[0])
        marginalCells += marginalSelected[marginalSelected.length - 1].cells
        currentEP = bestEP
      }
      results.push({ selected: marginalSelected, ep: currentEP })

      // Return best result that respects the limit
      let best = null
      for (const r of results) {
        if (maxPowerGhs !== null && r.ep > maxPowerGhs) continue
        if (!best || r.ep > best.ep) best = r
      }
      return best || { selected: [], ep: 0 }
    },

    // Post-optimization: batch-swap non-set miners with excluded set miners to complete set levels
    _swapOptimize(selected, allMinerData, rackConfigs, maxPowerGhs) {
      const configSetNames = new Set()
      rackConfigs.forEach(r => { if (r.is_set && r.set) configSetNames.add(r.set) })
      if (configSetNames.size === 0) return this._buildRackAssignment(rackConfigs, selected).ep

      const maxCells = rackConfigs.reduce((s, r) => s + r.size, 0)
      let currentEP = this._buildRackAssignment(rackConfigs, selected).ep
      let improved = true
      let iterations = 0

      while (improved && iterations < 20) {
        improved = false
        iterations++

        for (const setName of configSetNames) {
          // Get excluded set miners for this set (not currently selected)
          const selectedSet = new Set(selected)
          const excludedSet = allMinerData
            .filter(m => !selectedSet.has(m) && m._effectiveSet === setName)
            .sort((a, b) => b.iep - a.iep)
          if (excludedSet.length === 0) continue

          // Try batch sizes from 1 up to all available excluded set miners
          const maxBatch = Math.min(excludedSet.length, 8)

          for (let batchSize = 1; batchSize <= maxBatch; batchSize++) {
            const toAdd = excludedSet.slice(0, batchSize)
            const addCells = toAdd.reduce((s, m) => s + m.cells, 0)
            const totalCells = selected.reduce((s, m) => s + m.cells, 0)
            const freeSpace = maxCells - totalCells

            if (freeSpace >= addCells) {
              // Just add without removing
              const testSelected = [...selected, ...toAdd]
              const ep = this._buildRackAssignment(rackConfigs, testSelected).ep
              if ((maxPowerGhs === null || ep <= maxPowerGhs) && ep > currentEP) {
                for (const m of toAdd) selected.push(m)
                currentEP = ep
                improved = true
                break
              }
            } else {
              // Need to swap out weakest non-set miners to make room
              const cellsNeeded = addCells - freeSpace
              const removable = selected
                .map((m, idx) => ({ m, idx }))
                .filter(({ m }) => !m.isForced && !(m._effectiveSet && configSetNames.has(m._effectiveSet)))
                .sort((a, b) => a.m.iep - b.m.iep)

              let freed = 0
              const removeIdxs = []
              for (const { m, idx } of removable) {
                removeIdxs.push(idx)
                freed += m.cells
                if (freed >= cellsNeeded) break
              }

              if (freed >= cellsNeeded) {
                const removeSet = new Set(removeIdxs)
                const testSelected = selected.filter((_, i) => !removeSet.has(i))
                testSelected.push(...toAdd)

                const ep = this._buildRackAssignment(rackConfigs, testSelected).ep
                if ((maxPowerGhs === null || ep <= maxPowerGhs) && ep > currentEP) {
                  const sorted = [...removeIdxs].sort((a, b) => b - a)
                  for (const idx of sorted) selected.splice(idx, 1)
                  for (const m of toAdd) selected.push(m)
                  currentEP = ep
                  improved = true
                  break
                }
              }
            }
          }

          if (improved) break
        }
      }

      return currentEP
    },

    // Generate rack configurations to try
    _generateRackConfigs(totalSlots) {
      const available = []
      for (const ur of this.allUserRacks) {
        const qty = ur.quantity || 0
        if (qty > 0) available.push({ ...ur, qty: Math.min(qty, totalSlots) })
      }

      const configs = []
      // Limit totalSlots to actual racks available
      const totalAvailableRacks = available.reduce((s, r) => s + r.qty, 0)
      totalSlots = Math.min(totalSlots, totalAvailableRacks)

      // Helper: fill remaining slots using available racks (bonus desc, then no-bonus)
      const fillRemaining = (config) => {
        // Count how many of each rack are already used
        const used = {}
        for (const r of config) { const k = r.id || r.name; used[k] = (used[k] || 0) + 1 }
        // Sort all available by bonus desc
        const sorted = [...available].sort((a, b) => (b.bonus || 0) - (a.bonus || 0))
        for (const ar of sorted) {
          const k = ar.id || ar.name
          let rem = ar.qty - (used[k] || 0)
          while (rem > 0 && config.length < totalSlots) {
            config.push({ ...ar })
            rem--
          }
        }
        return config
      }

      // Config 1: all available racks sorted by bonus desc
      configs.push(fillRemaining([]))

      // Config 2: set racks first, then rest by bonus
      const setRacks = available.filter(r => r.is_set)
      if (setRacks.length > 0) {
        const config = []
        for (const sr of setRacks) {
          for (let i = 0; i < sr.qty && config.length < totalSlots; i++) {
            config.push({ ...sr })
          }
        }
        configs.push(fillRemaining(config))
      }

      // Config 3: bonus racks first (no sets), then rest
      const bonusNoSet = available.filter(r => (r.bonus || 0) > 0 && !r.is_set).sort((a, b) => (b.bonus || 0) - (a.bonus || 0))
      if (bonusNoSet.length > 0) {
        const config = []
        for (const br of bonusNoSet) {
          for (let i = 0; i < br.qty && config.length < totalSlots; i++) {
            config.push({ ...br })
          }
        }
        configs.push(fillRemaining(config))
      }

      // Config 4: set racks + bonus racks, then rest
      if (setRacks.length > 0 && bonusNoSet.length > 0) {
        const config = []
        for (const sr of setRacks) {
          for (let i = 0; i < sr.qty && config.length < totalSlots; i++) config.push({ ...sr })
        }
        for (const br of bonusNoSet) {
          for (let i = 0; i < br.qty && config.length < totalSlots; i++) config.push({ ...br })
        }
        configs.push(fillRemaining(config))
      }

      // Config 5: lowest bonus racks first (for raw power priority — minimizes EP from racks)
      {
        const config = []
        const sortedAsc = [...available].sort((a, b) => (a.bonus || 0) - (b.bonus || 0))
        for (const ar of sortedAsc) {
          for (let i = 0; i < ar.qty && config.length < totalSlots; i++) {
            config.push({ ...ar })
          }
        }
        if (config.length > 0) configs.push(config)
      }

      // Config 6: only 8-cell racks
      const racks8 = available.filter(r => r.size === 8).sort((a, b) => (b.bonus || 0) - (a.bonus || 0))
      if (racks8.length > 0) {
        const config = []
        for (const r of racks8) {
          for (let i = 0; i < r.qty && config.length < totalSlots; i++) config.push({ ...r })
        }
        if (config.length > 0) configs.push(config)
      }

      // Zero-bonus (non-set) racks: rack bonus only adds EP cost, never to the bonus sum, and
      // eats into the raw budget for raw priority. These configs avoid that.
      const zeroRacks = available.filter(r => (r.bonus || 0) === 0 && !r.is_set).sort((a, b) => b.size - a.size)

      // Config 7: set racks (for their set bonus) + zero-bonus racks only (no other bonus racks)
      if (setRacks.length > 0 && zeroRacks.length > 0) {
        const config = []
        for (const sr of setRacks) {
          for (let i = 0; i < sr.qty && config.length < totalSlots; i++) config.push({ ...sr })
        }
        for (const zr of zeroRacks) {
          for (let i = 0; i < zr.qty && config.length < totalSlots; i++) config.push({ ...zr })
        }
        if (config.length > 0) configs.push(config)
      }

      // Config 8: only zero-bonus racks (no sets, no bonus racks)
      if (zeroRacks.length > 0) {
        const config = []
        for (const zr of zeroRacks) {
          for (let i = 0; i < zr.qty && config.length < totalSlots; i++) config.push({ ...zr })
        }
        if (config.length > 0) configs.push(config)
      }

      return configs
    },

    // Whether a miner passes the auto-fill sellable filter (both / sellable / no-sellable)
    matchesAutoSellable(miner) {
      if (this.autoSellable === 'both') return true
      const sellable = this.isMinerSellable(miner)
      return this.autoSellable === 'sellable' ? sellable : !sellable
    },
    runAutoFill() {
      this.loading = true
      this.recordCurrentState()
      if (!this.autoEmptyRooms) {
        setTimeout(() => { this._doIncrementalFill() }, 50)
      } else {
        setTimeout(() => { this._doAutoFill() }, 50)
      }
    },

    _doIncrementalFill() {
      this.autoAddedUids = new Set()
      const maxPowerGhs = this.autoMaxPower ? this.autoMaxPower * 1e9 : null
      const priority = (maxPowerGhs !== null) ? this.autoPriority : 'default'

      // 1. If over limit, remove weakest miners one by one
      if (maxPowerGhs !== null) {
        // Single reactivity trigger to get accurate power
        for (let r = 1; r <= 4; r++) {
          if (this.activeRooms[r - 1]) this.$set(this.rooms, r, this.rooms[r])
        }
        while (this.totalPower > maxPowerGhs) {
          let worstRoom = null, worstKey = null, worstIdx = -1, worstVal = Infinity
          for (let r = 1; r <= 4; r++) {
            if (!this.activeRooms[r - 1]) continue
            Object.entries(this.rooms[r]).forEach(([key, slot]) => {
              if (!slot.miners) return
              slot.miners.forEach((m, idx) => {
                if (!m) return
                const p = this.parsePowerToGhs(m.power)
                const b = parseFloat(m.bonus) || 0
                const val = priority === 'bonus' ? b : priority === 'power' ? p : p * (1 + b / 100)
                if (val < worstVal) { worstVal = val; worstRoom = r; worstKey = key; worstIdx = idx }
              })
            })
          }
          if (worstRoom === null) break
          this.rooms[worstRoom][worstKey].miners.splice(worstIdx, 1)
          // Force recalc
          this.$set(this.rooms, worstRoom, this.rooms[worstRoom])
        }
      }

      // 2. Collect placed UIDs and available miners
      const placedUids = new Set()
      for (let r = 1; r <= 4; r++) {
        if (!this.activeRooms[r - 1]) continue
        Object.values(this.rooms[r]).forEach(slot => {
          if (slot.miners) slot.miners.forEach(m => { if (m && m.uid) placedUids.add(m.uid) })
        })
      }

      const availableMiners = this.loadedMiners.filter(m => !placedUids.has(m.uid) && this.matchesAutoSellable(m))
      const sortFn = priority === 'bonus'
        ? (a, b) => (parseFloat(b.bonus) || 0) - (parseFloat(a.bonus) || 0)
        : priority === 'power'
          ? (a, b) => this.parsePowerToGhs(b.power) - this.parsePowerToGhs(a.power)
          : (a, b) => {
              const aIep = this.parsePowerToGhs(a.power) * (1 + (parseFloat(a.bonus) || 0) / 100)
              const bIep = this.parsePowerToGhs(b.power) * (1 + (parseFloat(b.bonus) || 0) / 100)
              return bIep - aIep
            }
      availableMiners.sort(sortFn)

      // 3. Collect free cells in existing racks + place racks in empty room slots
      const freeSlots = []
      const avRacks = [...this.availableRacks].sort((a, b) => (b.bonus || 0) - (a.bonus || 0))
      const addedRackCounts = {}

      for (let r = 1; r <= 4; r++) {
        if (!this.activeRooms[r - 1]) continue
        const layout = this.getDataLayout(r)
        for (let rowIdx = 0; rowIdx < layout.length; rowIdx++) {
          for (let colIdx = 0; colIdx < layout[rowIdx].length; colIdx++) {
            if (!layout[rowIdx][colIdx]) continue
            const key = `${rowIdx}-${colIdx}`

            // If slot has a rack, check for free cells
            if (this.rooms[r][key] && this.rooms[r][key].rack) {
              const slot = this.rooms[r][key]
              const usedCells = (slot.miners || []).reduce((s, m) => s + (parseInt(m.cells) || 1), 0)
              const freeCells = (slot.rack.size || 8) - usedCells
              if (freeCells > 0) freeSlots.push({ slot, freeCells, bonus: slot.rack.bonus || 0 })
              continue
            }

            // Empty slot - assign best available rack
            let picked = null
            for (const ar of avRacks) {
              const rk = ar.id || ar.name
              if ((addedRackCounts[rk] || 0) < ar.available) { picked = ar; break }
            }
            if (!picked) continue
            addedRackCounts[picked.id || picked.name] = (addedRackCounts[picked.id || picked.name] || 0) + 1
            const newSlot = { rack: { ...picked }, miners: [] }
            this.$set(this.rooms[r], key, newSlot)
            freeSlots.push({ slot: newSlot, freeCells: picked.size || 8, bonus: picked.bonus || 0 })
          }
        }
      }
      freeSlots.sort((a, b) => b.bonus - a.bonus)

      // 4. Add all miners that fit (no limit or within limit)
      const toAdd = []
      for (const miner of availableMiners) {
        const cells = parseInt(miner.cells) || 1
        const rack = freeSlots.find(s => s.freeCells >= cells)
        if (!rack) continue
        rack.slot.miners.push(miner)
        rack.freeCells -= cells
        toAdd.push({ miner, rack })
      }

      // 5. If limit, check total and remove excess (from the weakest added miners)
      if (maxPowerGhs !== null && toAdd.length > 0) {
        // Trigger reactivity once to get accurate total
        for (let r = 1; r <= 4; r++) {
          if (this.activeRooms[r - 1]) this.$set(this.rooms, r, this.rooms[r])
        }

        // Sort added miners by contribution (weakest first) for removal
        const addedByVal = [...toAdd]
        addedByVal.sort((a, b) => {
          const pa = this.parsePowerToGhs(a.miner.power), pb = this.parsePowerToGhs(b.miner.power)
          const ba = parseFloat(a.miner.bonus) || 0, bb = parseFloat(b.miner.bonus) || 0
          const va = pa * (1 + ba / 100), vb = pb * (1 + bb / 100)
          return va - vb
        })

        while (this.totalPower > maxPowerGhs && addedByVal.length > 0) {
          const worst = addedByVal.shift()
          const idx = worst.rack.slot.miners.indexOf(worst.miner)
          if (idx !== -1) {
            worst.rack.slot.miners.splice(idx, 1)
            worst.rack.freeCells += (parseInt(worst.miner.cells) || 1)
            toAdd.splice(toAdd.indexOf(worst), 1)
          }
          this.$set(this.rooms, 1, this.rooms[1]) // trigger recalc
        }

        // 6. Gap-close: try removed miners + remaining skipped to fill closer to limit
        const remaining = availableMiners.filter(m => !toAdd.some(a => a.miner.uid === m.uid) && !placedUids.has(m.uid))
        let improved = true
        while (improved) {
          improved = false
          const curPow = this.totalPower
          let bestMiner = null, bestRack = null, bestPow = curPow

          for (const miner of remaining) {
            const cells = parseInt(miner.cells) || 1
            const rack = freeSlots.find(s => s.freeCells >= cells)
            if (!rack) continue

            // Estimate: just check if adding fits
            rack.slot.miners.push(miner)
            for (let r = 1; r <= 4; r++) {
              if (this.activeRooms[r - 1]) this.$set(this.rooms, r, this.rooms[r])
            }
            const newPow = this.totalPower
            rack.slot.miners.pop()

            if (newPow <= maxPowerGhs && newPow > bestPow) {
              bestPow = newPow; bestMiner = miner; bestRack = rack
            }
          }

          if (bestMiner) {
            bestRack.slot.miners.push(bestMiner)
            bestRack.freeCells -= (parseInt(bestMiner.cells) || 1)
            toAdd.push({ miner: bestMiner, rack: bestRack })
            remaining.splice(remaining.indexOf(bestMiner), 1)
            for (let r = 1; r <= 4; r++) {
              if (this.activeRooms[r - 1]) this.$set(this.rooms, r, this.rooms[r])
            }
            improved = true
          }
        }
      }

      // Mark added miners
      for (const { miner } of toAdd) this.autoAddedUids.add(miner.uid)

      // Single final reactivity trigger
      for (let r = 1; r <= 4; r++) {
        if (this.activeRooms[r - 1]) this.$set(this.rooms, r, this.rooms[r])
      }

      this.saveSnapshot()
      this.saveToStorage()
      this.loading = false
    },

    _doAutoFill() {
      this.autoAddedUids = new Set()

      // Clear all active rooms (algorithm needs clean slate)
      for (let r = 1; r <= 4; r++) {
        if (this.activeRooms[r - 1]) this.$set(this.rooms, r, {})
      }

      // 2. Count rack slots
      let totalSlots = 0
      for (let r = 1; r <= 4; r++) {
        if (!this.activeRooms[r - 1]) continue
        const layout = this.getDataLayout(r)
        layout.forEach(row => row.forEach(cell => { if (cell) totalSlots++ }))
      }
      if (totalSlots === 0) { this.loading = false; return }

      const maxPowerGhs = this.autoMaxPower ? this.autoMaxPower * 1e9 : null

      // 3. Prepare miner data (precompute effective set with rarity check)
      const minerData = this.loadedMiners.filter(m => this.matchesAutoSellable(m)).map(m => {
        const bonus = parseFloat(m.bonus) || 0
        const power = this.parsePowerToGhs(m.power)
        return {
          miner: m,
          power,
          bonus,
          cells: m.cells || 1,
          iep: power * (1 + bonus / 100),
          setName: m.setName || null,
          _effectiveSet: this.getMinerSetName(m) || null
        }
      })

      // 4. Generate rack configurations to try
      const rackConfigs = this._generateRackConfigs(totalSlots)

      // 5. For each rack config, try multiple strategies and keep the best
      let bestResult = null
      let bestConfig = null

      const priority = (maxPowerGhs !== null) ? this.autoPriority : 'default'

      const _isBetter = (candidate, current, config) => {
        if (!current) return true
        if (priority === 'default') return candidate.ep > current.ep
        // For power/bonus priority: directly compare the priority metric
        const cStats = this._buildRackAssignment(config, candidate.selected)
        const bStats = current._stats || this._buildRackAssignment(bestConfig, current.selected)
        current._stats = bStats
        // Tie-break on lower EP: rack bonus adds EP without adding to raw/bonus, so on an equal
        // metric the config with less rack bonus (lower EP) is preferred -> avoids bonus racks.
        if (priority === 'power') {
          if (Math.abs(cStats.rawPower - bStats.rawPower) > 1e-6) return cStats.rawPower > bStats.rawPower
          return cStats.ep < bStats.ep
        }
        if (priority === 'bonus') {
          if (Math.abs(cStats.bonusTotal - bStats.bonusTotal) > 1e-6) return cStats.bonusTotal > bStats.bonusTotal
          return cStats.ep < bStats.ep
        }
        return candidate.ep > current.ep
      }

      for (const config of rackConfigs) {
        const hasSetRacks = config.some(r => r.is_set && r.set)
        const strategies = [
          this._greedySelectWithRacks(minerData, config, maxPowerGhs, (a, b) => b.power - a.power),
          this._greedySelectWithRacks(minerData, config, maxPowerGhs, (a, b) => b.iep - a.iep),
          this._greedySelectWithRacks(minerData, config, maxPowerGhs, (a, b) => (b.power / b.cells) - (a.power / a.cells)),
          this._greedySelectWithRacks(minerData, config, maxPowerGhs, (a, b) => b.bonus - a.bonus),
          ...(hasSetRacks ? [this._greedyWithSetCommit(minerData, config, maxPowerGhs)] : [])
        ]
        // Power priority: cheap heuristics only. Both use an incremental EP model (a single
        // _buildRackAssignment at the end), unlike _greedyMaxRawPower which rebuilt the rack
        // assignment ~maxCells times per group and dominated the runtime.
        if (priority === 'power') {
          // Dynamic marginal-ratio fill (cheap: incremental EP, no per-candidate rack build)
          strategies.push(this._greedyMarginalRatio(minerData, config, maxPowerGhs, 'power'))
          // Structural max-raw-under-EP-cap solver (activate distinct set + fill with copies)
          strategies.push(this._maxRawUnderEP(minerData, config, maxPowerGhs))
        }
        // Bonus priority: cheap marginal-ratio fill + structural max-bonus-under-EP solver
        // (distinct miners only; duplicates add no bonus).
        if (priority === 'bonus') {
          strategies.push(this._greedyMarginalRatio(minerData, config, maxPowerGhs, 'bonus'))
          strategies.push(this._maxBonusUnderEP(minerData, config, maxPowerGhs))
        }

        for (const s of strategies) {
          if (_isBetter(s, bestResult, config)) {
            bestResult = s
            bestResult._stats = null
            bestConfig = config
          }
        }
      }

      // 5b. Final validation: if result exceeds limit, strip miners
      if (maxPowerGhs !== null && bestResult && bestConfig) {
        while (bestResult.selected.length > 0) {
          const ep = this._buildRackAssignment(bestConfig, bestResult.selected).ep
          if (ep <= maxPowerGhs) { bestResult.ep = ep; break }
          let worstIdx = 0, worstVal = Infinity
          for (let i = 0; i < bestResult.selected.length; i++) {
            const val = priority === 'bonus' ? bestResult.selected[i].bonus : bestResult.selected[i].power
            if (val < worstVal) { worstVal = val; worstIdx = i }
          }
          bestResult.selected.splice(worstIdx, 1)
        }
      }

      // 5c. Gap-fill: fill remaining rack cells with unselected miners sorted by power
      if (bestResult && bestConfig) {
        const maxCells = bestConfig.reduce((s, r) => s + r.size, 0)
        let usedCells = bestResult.selected.reduce((s, x) => s + x.cells, 0)
        const selUids = new Set(bestResult.selected.map(m => m.miner.uid))
        const gapSort = priority === 'bonus' ? ((a, b) => b.bonus - a.bonus) : ((a, b) => b.power - a.power)
        let unselected = minerData.filter(m => !selUids.has(m.miner.uid))
        if (priority === 'bonus') {
          // Duplicates add no bonus and only consume cells + EP budget — fill with NEW names only.
          const selNames = new Set(bestResult.selected.map(m => m.miner.name))
          unselected = unselected.filter(m => !selNames.has(m.miner.name))
        }
        unselected = unselected.sort(gapSort)
        for (const m of unselected) {
          if (usedCells + m.cells > maxCells) continue
          bestResult.selected.push(m)
          usedCells += m.cells
          if (maxPowerGhs !== null) {
            const ep = this._buildRackAssignment(bestConfig, bestResult.selected).ep
            if (ep > maxPowerGhs) { bestResult.selected.pop(); usedCells -= m.cells; continue }
          }
        }
        bestResult.ep = this._buildRackAssignment(bestConfig, bestResult.selected).ep
      }

      // 5d. Swap optimization: O(1) estimate with rack bonus + confirm top N
      if (bestResult && bestConfig) {
        let improved = true
        while (improved) {
          improved = false
          const selUids = new Set(bestResult.selected.map(m => m.miner.uid))
          const allUnsel = minerData.filter(m => !selUids.has(m.miner.uid))
          if (allUnsel.length === 0) break
          const unselDedup = this._dedupByName(allUnsel)

          // Get current assignment to know rack bonus per miner
          const curAssign = this._buildRackAssignment(bestConfig, bestResult.selected)
          const minerRackBonus = {}
          for (const ra of curAssign.assignments) {
            for (const m of ra.miners) { minerRackBonus[m.miner.uid] = ra.rackBonus }
          }

          // Pre-compute current state
          const nameCount = {}
          let curRawPower = 0, curBonus = 0, curRackExtra = 0
          const bonusSeen = new Set()
          for (const s of bestResult.selected) {
            curRawPower += s.power
            curRackExtra += s.power * (minerRackBonus[s.miner.uid] || 0) / 100
            nameCount[s.miner.name] = (nameCount[s.miner.name] || 0) + 1
            if (!bonusSeen.has(s.miner.name)) { bonusSeen.add(s.miner.name); curBonus += s.bonus }
          }
          const curEst = curRawPower * (1 + curBonus / 100) + curRackExtra

          // Estimate with rack bonus awareness
          const est1for1 = (sel, uns) => {
            const rackB = minerRackBonus[sel.miner.uid] || 0
            let newRaw = curRawPower - sel.power + uns.power
            let newBonus = curBonus
            if (nameCount[sel.miner.name] === 1) newBonus -= sel.bonus
            if (!nameCount[uns.miner.name]) newBonus += uns.bonus
            const newRackExtra = curRackExtra - sel.power * rackB / 100 + uns.power * rackB / 100
            return newRaw * (1 + newBonus / 100) + newRackExtra
          }

          let bestAction = null, bestEp = bestResult.ep, bestSwapMetric = null
          const _swapMetric = (stats) => {
            if (priority === 'power') return stats.rawPower
            if (priority === 'bonus') return stats.bonusTotal
            return stats.ep
          }
          if (priority !== 'default') {
            const curStats = this._buildRackAssignment(bestConfig, bestResult.selected)
            bestSwapMetric = _swapMetric(curStats)
          }

          // === 1-for-1: estimate all, confirm top 100 ===
          const est1for1Prio = (sel, uns) => {
            if (priority === 'power') return curRawPower - sel.power + uns.power
            if (priority === 'bonus') {
              let nb = curBonus
              if (nameCount[sel.miner.name] === 1) nb -= sel.bonus
              if (!nameCount[uns.miner.name]) nb += uns.bonus
              return nb
            }
            return est1for1(sel, uns)
          }
          const top1for1 = []
          for (let si = 0; si < bestResult.selected.length; si++) {
            const sel = bestResult.selected[si]
            for (const uns of unselDedup) {
              if (uns.cells !== sel.cells) continue
              top1for1.push({ si, sel, uns, est: est1for1Prio(sel, uns) })
            }
          }
          top1for1.sort((a, b) => b.est - a.est)
          const epFloor = priority !== 'default' && maxPowerGhs ? bestEp - maxPowerGhs * 0.001 : -Infinity
          for (const c of top1for1.slice(0, 300)) {
            bestResult.selected[c.si] = c.uns
            const swapResult = this._buildRackAssignment(bestConfig, bestResult.selected)
            bestResult.selected[c.si] = c.sel
            const ep = swapResult.ep
            if (maxPowerGhs !== null && ep > maxPowerGhs) continue
            if (priority !== 'default') {
              const metric = _swapMetric(swapResult)
              if (ep >= epFloor && metric > bestSwapMetric) {
                bestEp = ep; bestSwapMetric = metric; bestAction = { type: '1for1', si: c.si, uns: c.uns }
              }
            } else if (ep > bestEp) {
              bestEp = ep; bestAction = { type: '1for1', si: c.si, uns: c.uns }
            }
          }

          // === 2-for-1: estimate + confirm top 50 (only if 1-for-1 didn't improve) ===
          const unsel1 = allUnsel.filter(c => c.cells === 1).sort((a, b) => b.power - a.power).slice(0, 10)
          if (!bestAction && unsel1.length >= 2) {
            const top2for1 = []
            const sel2 = bestResult.selected.map((m, i) => ({ m, i })).filter(x => x.m.cells === 2)
            for (const { m: sel, i: si } of sel2) {
              const rB = minerRackBonus[sel.miner.uid] || 0
              for (let a = 0; a < unsel1.length; a++) {
                for (let b = a + 1; b < unsel1.length; b++) {
                  let newRaw = curRawPower - sel.power + unsel1[a].power + unsel1[b].power
                  let newBon = curBonus
                  if (nameCount[sel.miner.name] === 1) newBon -= sel.bonus
                  if (!nameCount[unsel1[a].miner.name]) newBon += unsel1[a].bonus
                  if (!nameCount[unsel1[b].miner.name] && unsel1[b].miner.name !== unsel1[a].miner.name) newBon += unsel1[b].bonus
                  const nre = curRackExtra - sel.power * rB / 100 + (unsel1[a].power + unsel1[b].power) * rB / 100
                  top2for1.push({ si, sel, a, b, est: newRaw * (1 + newBon / 100) + nre })
                }
              }
            }
            top2for1.sort((a, b) => b.est - a.est)
            for (const c of top2for1.slice(0, 300)) {
              bestResult.selected[c.si] = unsel1[c.a]
              bestResult.selected.push(unsel1[c.b])
              const swapResult = this._buildRackAssignment(bestConfig, bestResult.selected)
              bestResult.selected.pop()
              bestResult.selected[c.si] = c.sel
              const ep = swapResult.ep
              if (maxPowerGhs !== null && ep > maxPowerGhs) continue
              if (priority !== 'default') {
                const metric = _swapMetric(swapResult)
                if (ep >= epFloor && metric > bestSwapMetric) {
                  bestEp = ep; bestSwapMetric = metric; bestAction = { type: '2for1', si: c.si, pair: [unsel1[c.a], unsel1[c.b]] }
                }
              } else if (ep > bestEp) {
                bestEp = ep; bestAction = { type: '2for1', si: c.si, pair: [unsel1[c.a], unsel1[c.b]] }
              }
            }
          }

          // === 1-for-2: estimate + confirm top 20 (only if nothing found) ===
          const unsel2 = unselDedup.filter(c => c.cells === 2).sort((a, b) => b.power - a.power).slice(0, 5)
          if (!bestAction && unsel2.length > 0) {
            const weakSel1 = bestResult.selected.map((m, i) => ({ m, i })).filter(x => x.m.cells === 1)
              .sort((a, b) => a.m.power - b.m.power).slice(0, 6)
            const top1for2 = []
            for (let a = 0; a < weakSel1.length; a++) {
              for (let b = a + 1; b < weakSel1.length; b++) {
                const selA = weakSel1[a].m, selB = weakSel1[b].m
                const rA = minerRackBonus[selA.miner.uid] || 0
                const rB = minerRackBonus[selB.miner.uid] || 0
                for (const two of unsel2) {
                  let newRaw = curRawPower - selA.power - selB.power + two.power
                  let newBon = curBonus
                  if (nameCount[selA.miner.name] === 1) newBon -= selA.bonus
                  if (nameCount[selB.miner.name] === 1 && selB.miner.name !== selA.miner.name) newBon -= selB.bonus
                  if (!nameCount[two.miner.name]) newBon += two.bonus
                  const avgR = (rA + rB) / 2
                  const nre = curRackExtra - selA.power * rA / 100 - selB.power * rB / 100 + two.power * avgR / 100
                  top1for2.push({ idxA: weakSel1[a].i, idxB: weakSel1[b].i, two, est: newRaw * (1 + newBon / 100) + nre })
                }
              }
            }
            top1for2.sort((a, b) => b.est - a.est)
            for (const c of top1for2.slice(0, 50)) {
              const idxHi = Math.max(c.idxA, c.idxB), idxLo = Math.min(c.idxA, c.idxB)
              const saved0 = bestResult.selected[idxHi], saved1 = bestResult.selected[idxLo]
              bestResult.selected.splice(idxHi, 1)
              bestResult.selected.splice(idxLo, 1)
              bestResult.selected.push(c.two)
              const swapResult = this._buildRackAssignment(bestConfig, bestResult.selected)
              bestResult.selected.pop()
              bestResult.selected.splice(idxLo, 0, saved1)
              bestResult.selected.splice(idxHi, 0, saved0)
              const ep = swapResult.ep
              if (maxPowerGhs !== null && ep > maxPowerGhs) continue
              if (priority !== 'default') {
                const metric = _swapMetric(swapResult)
                if (ep >= epFloor && metric > bestSwapMetric) {
                  bestEp = ep; bestSwapMetric = metric; bestAction = { type: '1for2', idxA: c.idxA, idxB: c.idxB, two: c.two }
                }
              } else if (ep > bestEp) {
                bestEp = ep; bestAction = { type: '1for2', idxA: c.idxA, idxB: c.idxB, two: c.two }
              }
            }
          }

          // Apply best action
          if (bestAction) {
            if (bestAction.type === '1for1') {
              bestResult.selected[bestAction.si] = bestAction.uns
            } else if (bestAction.type === '2for1') {
              bestResult.selected.splice(bestAction.si, 1)
              bestResult.selected.push(bestAction.pair[0], bestAction.pair[1])
            } else if (bestAction.type === '1for2') {
              const [ia, ib] = [bestAction.idxA, bestAction.idxB].sort((a, b) => b - a)
              bestResult.selected.splice(ia, 1)
              bestResult.selected.splice(ib, 1)
              bestResult.selected.push(bestAction.two)
            }
            bestResult.ep = bestEp
            improved = true
          }
        }
      }

      if (!bestResult || bestResult.selected.length === 0) {
        this.saveSnapshot()
        this.saveToStorage()
        this.loading = false
        return
      }

      // 5e. Rack cleanup (raw/bonus priority): rack bonus adds EP cost but never to the raw or
      // bonus totals, so replace any bonus rack that isn't "earning" it — non-set bonus racks,
      // and set racks whose set isn't activated — with a 0-bonus rack of the same size.
      if (priority !== 'default') {
        const setMap = this._getSetMap()
        const zeroBySize = {}
        for (const ur of this.allUserRacks) {
          if ((ur.bonus || 0) === 0 && !ur.is_set && (ur.quantity || 0) > 0) {
            if (!zeroBySize[ur.size]) zeroBySize[ur.size] = ur
          }
        }
        for (let i = 0; i < bestConfig.length; i++) {
          const rk = bestConfig[i]
          if (!(rk.bonus > 0)) continue
          let earning = false
          if (rk.is_set && rk.set) {
            const setDef = setMap[rk.set]
            const minReq = setDef && setDef.levels.length ? Math.min(...setDef.levels.map(l => l.required)) : Infinity
            const cnt = bestResult.selected.filter(m => m._effectiveSet === rk.set).length
            earning = cnt >= minReq
          }
          if (!earning && zeroBySize[rk.size]) bestConfig[i] = { ...zeroBySize[rk.size] }
        }
        bestResult.ep = this._buildRackAssignment(bestConfig, bestResult.selected).ep
      }

      // 6. Assign racks to room slots
      const sortedRacks = [...bestConfig].sort((a, b) => (b.bonus || 0) - (a.bonus || 0))
      const rackSlots = []
      let rackIdx = 0
      for (let r = 1; r <= 4; r++) {
        if (!this.activeRooms[r - 1]) continue
        const layout = this.getDataLayout(r)
        for (let rowIdx = 0; rowIdx < layout.length; rowIdx++) {
          for (let colIdx = 0; colIdx < layout[rowIdx].length; colIdx++) {
            if (!layout[rowIdx][colIdx]) continue
            if (rackIdx >= sortedRacks.length) break
            const rack = sortedRacks[rackIdx++]
            const key = `${rowIdx}-${colIdx}`
            this.$set(this.rooms[r], key, { rack: { ...rack }, miners: [] })
            rackSlots.push({
              slot: this.rooms[r][key],
              setName: (rack.is_set && rack.set) ? rack.set : null,
              bonus: rack.bonus || 0,
              size: rack.size,
              used: 0
            })
          }
        }
      }

      // 7. Place miners: set miners into their set racks first, then fill rest
      const usedUids = new Set()
      const selectedData = bestResult.selected

      // Pass 1: place set miners into matching set racks — ONLY if enough to activate a set level
      const setMap = this._getSetMap()
      const setMinerCounts = {}
      for (const md of selectedData) {
        if (md._effectiveSet) setMinerCounts[md._effectiveSet] = (setMinerCounts[md._effectiveSet] || 0) + 1
      }

      for (const rs of rackSlots) {
        if (!rs.setName) continue
        const setDef = setMap[rs.setName]
        const minRequired = setDef && setDef.levels.length > 0
          ? Math.min(...setDef.levels.map(l => l.required))
          : Infinity
        // Skip set placement if not enough miners to activate any level
        if ((setMinerCounts[rs.setName] || 0) < minRequired) continue

        const candidates = selectedData
          .filter(md => md._effectiveSet === rs.setName && !usedUids.has(md.miner.uid))
          .sort((a, b) => (b.power + b.bonus) - (a.power + a.bonus))

        for (const md of candidates) {
          if (rs.used + md.cells > rs.size) continue
          rs.slot.miners.push(md.miner)
          usedUids.add(md.miner.uid)
          rs.used += md.cells
        }
      }

      // Pass 2: fill remaining space - highest power-per-cell miners into highest bonus racks
      const remaining = selectedData
        .filter(md => !usedUids.has(md.miner.uid))
        .sort((a, b) => (b.power / b.cells) - (a.power / a.cells))

      const racksByBonus = [...rackSlots].sort((a, b) => b.bonus - a.bonus)
      for (const md of remaining) {
        const rack = racksByBonus.find(rs => rs.used + md.cells <= rs.size)
        if (rack) {
          rack.slot.miners.push(md.miner)
          usedUids.add(md.miner.uid)
          rack.used += md.cells
        }
      }

      // 7b. Compare with no-set placement — if ignoring sets gives more power, redo
      if (bestConfig.some(r => r.is_set && r.set)) {
        const withSetPower = this.totalPower

        // Save current state
        const savedRooms = JSON.parse(JSON.stringify(this.rooms))

        // Clear and redo without set priority
        for (const rs of rackSlots) {
          rs.slot.miners = []
          rs.used = 0
        }
        const allByPower = [...selectedData].sort((a, b) => (b.power / b.cells) - (a.power / a.cells))
        for (const md of allByPower) {
          const rack = racksByBonus.find(rs => rs.used + md.cells <= rs.size)
          if (rack) {
            rack.slot.miners.push(md.miner)
            rack.used += md.cells
          }
        }

        // Force Vue reactivity to recalc
        for (let r = 1; r <= 4; r++) {
          if (this.activeRooms[r - 1]) this.$set(this.rooms, r, this.rooms[r])
        }

        const noSetPower = this.totalPower

        if (noSetPower <= withSetPower) {
          // With-set was better or equal, restore
          for (let r = 1; r <= 4; r++) {
            this.$set(this.rooms, r, savedRooms[r])
          }
        }
      }

      // Re-sort miners inside each rack by user preference
      const visualSort = this.autoOrderBy === 'power'
        ? (a, b) => this.parsePowerToGhs(b.power) - this.parsePowerToGhs(a.power)
        : (a, b) => (parseFloat(b.bonus) || 0) - (parseFloat(a.bonus) || 0)
      for (const rs of rackSlots) {
        rs.slot.miners.sort(visualSort)
      }

      // Remove empty racks (no miners placed)
      this._removeEmptyRacks()

      // Final power limit enforcement on actual placed state
      if (maxPowerGhs !== null) {
        while (this.totalPower > maxPowerGhs) {
          // Find weakest miner across all rooms and remove it
          let worstRoom = null, worstKey = null, worstIdx = -1, worstIep = Infinity
          for (let r = 1; r <= 4; r++) {
            if (!this.activeRooms[r - 1]) continue
            Object.entries(this.rooms[r]).forEach(([key, slot]) => {
              if (!slot.miners) return
              slot.miners.forEach((m, idx) => {
                if (!m) return
                const iep = this.parsePowerToGhs(m.power) * (1 + (parseFloat(m.bonus) || 0) / 100)
                if (iep < worstIep) { worstIep = iep; worstRoom = r; worstKey = key; worstIdx = idx }
              })
            })
          }
          if (worstRoom === null) break
          this.rooms[worstRoom][worstKey].miners.splice(worstIdx, 1)
        }
      }

      this.saveSnapshot()
      this.saveToStorage()
      this.loading = false
    },

    // Remove rack slots that have no miners
    _removeEmptyRacks() {
      for (let r = 1; r <= 4; r++) {
        const roomData = this.rooms[r]
        const keys = Object.keys(roomData)
        for (const key of keys) {
          if (!roomData[key].miners || roomData[key].miners.length === 0) {
            this.$delete(roomData, key)
          }
        }
      }
    },

    // ========== MANUAL MODE - CLICK TO ADD ==========
    // Tooltip (fixed position in body)
    showMinerTooltip(miner, event) {
      this.hideMinerTooltip()
      const el = event.currentTarget
      const rect = el.getBoundingClientRect()
      const tip = document.createElement('div')
      tip.className = 'room-miner-tooltip-fixed'
      tip.innerHTML = `<span class="tooltip-name">${this.getCleanName(miner.name)}</span><span class="tooltip-stats">${miner.power} | ${miner.bonus}%</span>`
      tip.style.left = (rect.left + rect.width / 2) + 'px'
      tip.style.top = '-9999px'
      document.body.appendChild(tip)
      const tipRect = tip.getBoundingClientRect()
      tip.style.top = (rect.top - tipRect.height - 8) + 'px'
      this._minerTooltip = tip
    },
    hideMinerTooltip() {
      if (this._minerTooltip) {
        document.body.removeChild(this._minerTooltip)
        this._minerTooltip = null
      }
    },

    // Rack remove button (fixed position in body)
    showRackRemove(roomNum, rowIdx, colIdx, event) {
      clearTimeout(this._rackRemoveTimer)
      this.hideRackRemove(true)
      const el = event.currentTarget
      const rect = el.getBoundingClientRect()
      const btn = document.createElement('button')
      btn.className = 'room-rack-remove-fixed'
      btn.innerHTML = '&times;'
      btn.style.left = (rect.right) + 'px'
      btn.style.top = (rect.top) + 'px'
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        this.removeRackFromRoom(roomNum, rowIdx, colIdx)
        this.hideRackRemove(true)
      })
      btn.addEventListener('mouseenter', () => clearTimeout(this._rackRemoveTimer))
      btn.addEventListener('mouseleave', () => { this._rackRemoveTimer = setTimeout(() => this.hideRackRemove(true), 50) })
      document.body.appendChild(btn)
      this._rackRemoveBtn = btn
      this._rackRemoveInfo = { roomNum, rowIdx, colIdx }
    },
    hideRackRemove(immediate) {
      if (immediate) clearTimeout(this._rackRemoveTimer)
      if (!immediate) {
        this._rackRemoveTimer = setTimeout(() => {
          if (this._rackRemoveBtn) { document.body.removeChild(this._rackRemoveBtn); this._rackRemoveBtn = null }
        }, 50)
        return
      }
      if (this._rackRemoveBtn) {
        document.body.removeChild(this._rackRemoveBtn)
        this._rackRemoveBtn = null
        this._rackRemoveInfo = null
      }
    },

    removeMinerFromRoom(roomNum, rowIdx, colIdx, miner) {
      const key = this.getSlotDataKey(roomNum, rowIdx, colIdx)
      const slot = this.rooms[roomNum][key]
      if (!slot || !slot.miners) return
      const idx = slot.miners.findIndex(m => m && m.uid === miner.uid)
      if (idx === -1) return
      this.recordCurrentState()
      slot.miners.splice(idx, 1)
      this.saveSnapshot()
      this.saveToStorage()
    },

    removeRackFromRoom(roomNum, rowIdx, colIdx) {
      const key = this.getSlotDataKey(roomNum, rowIdx, colIdx)
      if (!this.rooms[roomNum][key]) return
      this.recordCurrentState()
      this.$delete(this.rooms[roomNum], key)
      this.saveSnapshot()
      this.saveToStorage()
    },

    manualClickMiner(miner) {
      const cells = miner.cells || 1
      for (let r = 1; r <= 4; r++) {
        if (!this.activeRooms[r - 1]) continue
        const layout = this.getDataLayout(r)
        for (let rowIdx = 0; rowIdx < layout.length; rowIdx++) {
          for (let colIdx = 0; colIdx < layout[rowIdx].length; colIdx++) {
            if (!layout[rowIdx][colIdx]) continue
            const key = `${rowIdx}-${colIdx}`
            const slot = this.rooms[r][key]
            if (!slot || !slot.rack) continue
            const used = (slot.miners || []).reduce((s, m) => s + (m ? (m.cells || 1) : 0), 0)
            if (used + cells <= slot.rack.size) {
              this.recordCurrentState()
              slot.miners.push(miner)
              this.saveSnapshot()
              this.saveToStorage()
              return
            }
          }
        }
      }
    },

    manualClickRack(rack) {
      for (let r = 1; r <= 4; r++) {
        if (!this.activeRooms[r - 1]) continue
        const layout = this.getDataLayout(r)
        for (let rowIdx = 0; rowIdx < layout.length; rowIdx++) {
          for (let colIdx = 0; colIdx < layout[rowIdx].length; colIdx++) {
            if (!layout[rowIdx][colIdx]) continue
            const key = `${rowIdx}-${colIdx}`
            if (!this.rooms[r][key]) {
              this.recordCurrentState()
              this.$set(this.rooms[r], key, { rack: { ...rack }, miners: [] })
              this.saveSnapshot()
              this.saveToStorage()
              return
            }
          }
        }
      }
    },

    // ========== MANUAL MODE - DRAG AND DROP ==========
    computeValidDropTargets(type, item) {
      const targets = new Set()
      for (let r = 1; r <= 4; r++) {
        if (!this.activeRooms[r - 1]) continue
        const layout = this.getRoomLayout(r)
        for (let rowIdx = 0; rowIdx < layout.length; rowIdx++) {
          for (let colIdx = 0; colIdx < layout[rowIdx].length; colIdx++) {
            if (!layout[rowIdx][colIdx]) continue
            const dataKey = this.getSlotDataKey(r, rowIdx, colIdx)
            if (type === 'miner') {
              const slot = this.rooms[r][dataKey]
              if (!slot || !slot.rack) continue
              const used = (slot.miners || []).reduce((s, m) => s + (m ? (m.cells || 1) : 0), 0)
              if (used + (item.cells || 1) <= slot.rack.size) {
                targets.add(`${r}-${rowIdx}-${colIdx}`)
              }
            } else {
              if (!this.rooms[r][dataKey]) {
                targets.add(`${r}-${rowIdx}-${colIdx}`)
              }
            }
          }
        }
      }
      return targets
    },

    onManualMouseDown(type, item, event) {
      if (event.button !== 0) return
      event.preventDefault()
      this._dragPending = { type, item, startX: event.clientX, startY: event.clientY }
      this._onMouseMoveRef = (e) => this._onDragMouseMove(e)
      this._onMouseUpRef = (e) => this._onDragMouseUp(e)
      document.addEventListener('mousemove', this._onMouseMoveRef)
      document.addEventListener('mouseup', this._onMouseUpRef)
    },

    _onDragMouseMove(event) {
      if (this._dragPending && !this.dragItem) {
        const dx = event.clientX - this._dragPending.startX
        const dy = event.clientY - this._dragPending.startY
        if (Math.abs(dx) + Math.abs(dy) > 5) {
          const { type, item } = this._dragPending
          this.dragItem = { type, data: item }
          this.validDropTargetKeys = this.computeValidDropTargets(type, item)
          const imgUrl = type === 'miner' ? this.getMinerImageUrl(item) : this.getRackImageUrl(item)
          if (imgUrl) {
            const ghost = document.createElement('div')
            ghost.className = 'manual-drag-ghost'
            const imgWrap = document.createElement('div')
            imgWrap.className = 'drag-ghost-img-wrap ' + (type === 'miner' ? 'drag-ghost-miner' : 'drag-ghost-rack')
            const img = document.createElement('img')
            img.src = imgUrl
            img.className = 'drag-ghost-img'
            imgWrap.appendChild(img)
            // Add badges
            const badges = document.createElement('div')
            badges.className = 'drag-ghost-badges'
            if (type === 'miner') {
              if (item.isLegacy) { const b = document.createElement('img'); b.src = this.getAssetUrl('others/legacy.png'); badges.appendChild(b) }
              else if (this.getRarityLevel(item.name)) { const b = document.createElement('img'); b.src = this.getLevelIcon(item.name); badges.appendChild(b) }
              if (item.isSet) { const b = document.createElement('img'); b.src = this.getAssetUrl('others/set.png'); badges.appendChild(b) }
            } else {
              if (item.is_set) { const b = document.createElement('img'); b.src = this.getAssetUrl('others/set.png'); badges.appendChild(b) }
            }
            if (badges.children.length > 0) imgWrap.appendChild(badges)
            ghost.appendChild(imgWrap)
            document.body.appendChild(ghost)
            this._dragGhost = ghost
          }
          document.body.style.userSelect = 'none'
        }
        return
      }
      if (!this.dragItem) return
      if (this._dragGhost) {
        this._dragGhost.style.left = event.clientX + 'px'
        this._dragGhost.style.top = event.clientY + 'px'
      }
      const el = document.elementFromPoint(event.clientX, event.clientY)
      const cell = el && el.closest('[data-drop-key]')
      if (cell) {
        const key = cell.dataset.dropKey
        this.dragOverSlot = (this.validDropTargetKeys && this.validDropTargetKeys.has(key)) ? key : null
      } else {
        this.dragOverSlot = null
      }
    },

    _onDragMouseUp(event) {
      document.removeEventListener('mousemove', this._onMouseMoveRef)
      document.removeEventListener('mouseup', this._onMouseUpRef)

      if (this.dragItem) {
        if (this.dragOverSlot && this.validDropTargetKeys && this.validDropTargetKeys.has(this.dragOverSlot)) {
          const parts = this.dragOverSlot.split('-').map(Number)
          this.recordCurrentState()
          const slotKey = this.getSlotDataKey(parts[0], parts[1], parts[2])
          if (this.dragItem.type === 'miner') {
            const slot = this.rooms[parts[0]][slotKey]
            if (slot && slot.rack) slot.miners.push(this.dragItem.data)
          } else {
            this.$set(this.rooms[parts[0]], slotKey, { rack: { ...this.dragItem.data }, miners: [] })
          }
          this.saveSnapshot()
          this.saveToStorage()
        }
        if (this._dragGhost) { document.body.removeChild(this._dragGhost); this._dragGhost = null }
        document.body.style.userSelect = ''
        this.dragItem = null
        this.dragOverSlot = null
        this.validDropTargetKeys = null
      } else if (this._dragPending) {
        if (this._dragPending.type === 'miner') this.manualClickMiner(this._dragPending.item)
        else this.manualClickRack(this._dragPending.item)
      }
      this._dragPending = null
    },

    isDropTarget(roomNum, rowIdx, colIdx) {
      return this.validDropTargetKeys !== null && this.validDropTargetKeys.has(`${roomNum}-${rowIdx}-${colIdx}`)
    },

    isDropHover(roomNum, rowIdx, colIdx) {
      return this.dragOverSlot === `${roomNum}-${rowIdx}-${colIdx}`
    },

    // ========== MANUAL ADD MINERS (SELECT MODE) ==========
    toggleManualMinerSelect(uid) {
      if (this.manualSelectedMiners[uid]) {
        this.$delete(this.manualSelectedMiners, uid)
      } else {
        this.$set(this.manualSelectedMiners, uid, true)
      }
    },

    continueManualAdd() {
      const plan = this.calculateManualAddPlan()
      if (!plan) return
      this.manualAddPlan = plan
      this.manualAddStep = 'summary'
    },

    cancelManualAdd() {
      this.manualSelectedMiners = {}
      this.manualAddStep = 'select'
      this.manualAddPlan = null
      this.minerSelectState = {}
    },

    confirmManualAdd() {
      if (!this.manualAddPlan) return
      this.recordCurrentState()
      // Apply simulated rooms state
      this.rooms = this.manualAddPlan.simulatedRooms
      this.saveSnapshot()
      this.saveToStorage()
      this.cancelManualAdd()
    },

    calculateManualAddPlan() {
      const selectedMiners = this.manualSelectedMinersList
      if (selectedMiners.length === 0) return null

      const simRooms = JSON.parse(JSON.stringify(this.rooms))
      const simActiveRooms = [...this.activeRooms]

      // 1. Count total rack slots across ALL active rooms
      let totalSlots = 0
      for (let r = 1; r <= 4; r++) {
        if (!simActiveRooms[r - 1]) continue
        const layout = this.getDataLayout(r)
        layout.forEach(row => row.forEach(cell => { if (cell) totalSlots++ }))
      }
      if (totalSlots === 0) return null

      // 2. Gather ALL miners currently placed across all active rooms
      const currentlyPlaced = {}
      for (let r = 1; r <= 4; r++) {
        if (!simActiveRooms[r - 1]) continue
        Object.entries(this.rooms[r]).forEach(([key, slot]) => {
          if (slot.miners) {
            slot.miners.forEach(m => { if (m) currentlyPlaced[m.uid] = m })
          }
        })
      }

      // 3. Build full miner pool: currently placed + selected new ones
      const selectedUids = new Set(selectedMiners.map(m => m.uid))
      const allMiners = []
      Object.values(currentlyPlaced).forEach(m => allMiners.push(m))
      selectedMiners.forEach(m => { if (!currentlyPlaced[m.uid]) allMiners.push(m) })

      const minerData = allMiners.map(m => {
        const bonus = parseFloat(m.bonus) || 0
        const power = this.parsePowerToGhs(m.power)
        return {
          miner: m,
          power,
          bonus,
          cells: m.cells || 1,
          iep: power * (1 + bonus / 100),
          setName: m.setName || null,
          _effectiveSet: this.getMinerSetName(m) || null,
          isForced: selectedUids.has(m.uid)
        }
      })

      // 4. FAST PATH: if selected miners fit in current racks, just place them directly
      const cellsNeeded = selectedMiners.reduce((s, m) => s + (m.cells || 1), 0)
      let availableCells = 0
      for (let r = 1; r <= 4; r++) {
        if (!simActiveRooms[r - 1]) continue
        Object.values(this.rooms[r]).forEach(slot => {
          if (slot && slot.rack) {
            const used = (slot.miners || []).reduce((s, m) => s + (m ? (m.cells || 1) : 0), 0)
            availableCells += slot.rack.size - used
          }
        })
      }
      // Helper: clone rooms preserving structure
      const _cloneRooms = () => {
        const cloned = JSON.parse(JSON.stringify(this.rooms))
        return cloned
      }

      // Helper: place miners into simulated rooms (greedy best-fit)
      const _placeMinersList = (miners, sRooms) => {
        const placed = []
        const notPlaced = []
        const toPlace = [...miners].sort((a, b) => {
          const aSet = this.getMinerSetName(a)
          const bSet = this.getMinerSetName(b)
          if (aSet && !bSet) return -1
          if (!aSet && bSet) return 1
          return this.parsePowerToGhs(b.power) - this.parsePowerToGhs(a.power)
        })
        for (const miner of toPlace) {
          let bestRoom = null, bestKey = null, bestScore = -1
          const minerSet = this.getMinerSetName(miner)
          for (let r = 1; r <= 4; r++) {
            if (!simActiveRooms[r - 1]) continue
            for (const [key, slot] of Object.entries(sRooms[r])) {
              if (!slot || !slot.rack) continue
              const used = (slot.miners || []).reduce((s, m) => s + (m ? (m.cells || 1) : 0), 0)
              if (used + (miner.cells || 1) > slot.rack.size) continue
              let score = (slot.rack.bonus || 0) * 100
              if (minerSet && slot.rack.is_set && slot.rack.set === minerSet) score += 10000
              if (score > bestScore) { bestScore = score; bestRoom = r; bestKey = key }
            }
          }
          if (bestRoom !== null) { sRooms[bestRoom][bestKey].miners.push(miner); placed.push(miner) }
          else notPlaced.push(miner)
        }
        return { placed, notPlaced }
      }

      // 4a. FAST PATH: miners fit in existing racks — no changes needed
      if (availableCells >= cellsNeeded) {
        const sRooms = _cloneRooms()
        _placeMinersList(selectedMiners, sRooms)
        const newTotals = this._simulateTotals(sRooms, simActiveRooms)
        const oldPower = this.totalPower
        const oldBonus = this.totalBonus
        return {
          toAdd: selectedMiners, toRemove: [], rackChanges: [],
          newPower: newTotals.totalPower, newBonus: newTotals.totalBonus,
          oldPower, oldBonus,
          powerDelta: newTotals.totalPower - oldPower,
          bonusDelta: newTotals.totalBonus - oldBonus,
          simulatedRooms: sRooms
        }
      }

      // 4b. MEDIUM PATH: add racks to empty slots to create enough space
      {
        const sRooms = _cloneRooms()
        let extraCells = availableCells
        const rackChanges = []
        const avRacks = [...this.availableRacks].sort((a, b) => (b.bonus || 0) - (a.bonus || 0))
        const emptySlots = []
        for (let r = 1; r <= 4; r++) {
          if (!simActiveRooms[r - 1]) continue
          const layout = this.getDataLayout(r)
          for (let rowIdx = 0; rowIdx < layout.length; rowIdx++) {
            for (let colIdx = 0; colIdx < layout[rowIdx].length; colIdx++) {
              if (!layout[rowIdx][colIdx]) continue
              const key = `${rowIdx}-${colIdx}`
              if (!sRooms[r][key] || !sRooms[r][key].rack) emptySlots.push({ room: r, key })
            }
          }
        }
        if (emptySlots.length > 0 && avRacks.length > 0) {
          const addedRackCounts = {}
          for (const eslot of emptySlots) {
            if (extraCells >= cellsNeeded) break
            let picked = null
            for (const ar of avRacks) {
              const usedQty = addedRackCounts[ar.id || ar.name] || 0
              if (usedQty < ar.available) { picked = ar; break }
            }
            if (!picked) break
            const rackKey = picked.id || picked.name
            addedRackCounts[rackKey] = (addedRackCounts[rackKey] || 0) + 1
            sRooms[eslot.room][eslot.key] = { rack: { ...picked }, miners: [] }
            extraCells += picked.size
          }
          for (const [k, qty] of Object.entries(addedRackCounts)) {
            const rack = avRacks.find(r => (r.id || r.name) === k)
            if (rack) rackChanges.push({ type: 'add', rack, qty })
          }
        }
        if (extraCells >= cellsNeeded) {
          _placeMinersList(selectedMiners, sRooms)
          const newTotals = this._simulateTotals(sRooms, simActiveRooms)
          const oldPower = this.totalPower
          const oldBonus = this.totalBonus
          return {
            toAdd: selectedMiners, toRemove: [], rackChanges,
            newPower: newTotals.totalPower, newBonus: newTotals.totalBonus,
            oldPower, oldBonus,
            powerDelta: newTotals.totalPower - oldPower,
            bonusDelta: newTotals.totalBonus - oldBonus,
            simulatedRooms: sRooms
          }
        }
      }

      // 4c. SWAP PATH: rooms full — remove cheapest miners to make room
      {
        const sRooms = _cloneRooms()

        // Build rack info: for each rack, list its miners with IEP
        const rackInfos = []
        for (let r = 1; r <= 4; r++) {
          if (!simActiveRooms[r - 1]) continue
          for (const [key, slot] of Object.entries(sRooms[r])) {
            if (!slot || !slot.rack) continue
            const rackBonus = slot.rack.bonus || 0
            const miners = (slot.miners || []).map((m, idx) => {
              if (!m) return null
              const power = this.parsePowerToGhs(m.power)
              const bonus = parseFloat(m.bonus) || 0
              // Real cost: includes rack bonus effect on this miner's power
              const realCost = power * (1 + (bonus + rackBonus) / 100)
              return { room: r, key, mIdx: idx, miner: m, cells: m.cells || 1, iep: realCost }
            }).filter(x => x !== null)
            const usedCells = miners.reduce((s, m) => s + m.cells, 0)
            rackInfos.push({ room: r, key, rack: slot.rack, size: slot.rack.size, freeCells: slot.rack.size - usedCells, miners })
          }
        }

        // For each selected miner, find the cheapest way to place it
        // Process larger miners first (harder to place)
        const sortedSelected = [...selectedMiners].sort((a, b) => (b.cells || 1) - (a.cells || 1))
        const allRemovals = []
        let swapOk = true

        for (const selMiner of sortedSelected) {
          const needed = selMiner.cells || 1

          // First check: does it already fit somewhere?
          let fits = false
          for (const ri of rackInfos) {
            if (ri.freeCells >= needed) { fits = true; break }
          }
          if (fits) {
            // It fits, reserve the space (reduce freeCells of best rack)
            let bestRi = null, bestScore = -1
            for (const ri of rackInfos) {
              if (ri.freeCells < needed) continue
              let score = (ri.rack.bonus || 0) * 100
              if (selMiner._effectiveSet && ri.rack.is_set && ri.rack.set === selMiner._effectiveSet) score += 10000
              if (score > bestScore) { bestScore = score; bestRi = ri }
            }
            if (bestRi) bestRi.freeCells -= needed
            continue
          }

          // Doesn't fit — find the rack where removing miners causes LEAST power loss
          // For each rack, find best removal subset, then SIMULATE actual power to compare
          let bestOption = null, bestOptionPower = -Infinity

          for (const ri of rackInfos) {
            const extraNeeded = needed - ri.freeCells
            if (extraNeeded <= 0) continue

            const removable = ri.miners
              .filter(m => !selectedUids.has(m.miner.uid) && !allRemovals.some(rm => rm.miner.uid === m.miner.uid))
              .sort((a, b) => a.iep - b.iep)

            // Find valid removal subsets (cells >= extraNeeded)
            let candidates = []
            if (removable.length <= 8) {
              // Exhaustive: try all subsets
              for (let mask = 1; mask < (1 << removable.length); mask++) {
                let cells = 0
                const subset = []
                for (let b = 0; b < removable.length; b++) {
                  if (mask & (1 << b)) { cells += removable[b].cells; subset.push(removable[b]) }
                }
                if (cells >= extraNeeded) candidates.push(subset)
              }
              // Keep only top 3 by lowest IEP to limit simulations
              candidates.sort((a, b) => a.reduce((s, m) => s + m.iep, 0) - b.reduce((s, m) => s + m.iep, 0))
              candidates = candidates.slice(0, 3)
            } else {
              // Greedy by IEP
              const subset = []
              let freed = 0
              for (const m of removable) {
                if (freed >= extraNeeded) break
                subset.push(m); freed += m.cells
              }
              if (freed >= extraNeeded) candidates.push(subset)
              // Also try greedy by IEP/cell
              const sorted2 = [...removable].sort((a, b) => (a.iep / a.cells) - (b.iep / b.cells))
              const subset2 = []
              let freed2 = 0
              for (const m of sorted2) {
                if (freed2 >= extraNeeded) break
                subset2.push(m); freed2 += m.cells
              }
              if (freed2 >= extraNeeded) candidates.push(subset2)
            }

            // Simulate each candidate to find actual best
            for (const subset of candidates) {
              const testRooms = JSON.parse(JSON.stringify(sRooms))
              // Apply all previous removals
              for (const rm of allRemovals) {
                const slot = testRooms[rm.room][rm.key]
                if (slot && slot.miners) slot.miners[rm.mIdx] = null
              }
              // Apply this removal
              for (const rm of subset) {
                const slot = testRooms[rm.room][rm.key]
                if (slot && slot.miners) slot.miners[rm.mIdx] = null
              }
              // Clean nulls
              for (let r2 = 1; r2 <= 4; r2++) {
                if (!simActiveRooms[r2 - 1]) continue
                for (const [k, sl] of Object.entries(testRooms[r2])) {
                  if (sl && sl.miners) sl.miners = sl.miners.filter(m => m !== null)
                }
              }
              // Place the current miner + all previously handled selected miners
              const alreadyPlaced = sortedSelected.slice(0, sortedSelected.indexOf(selMiner))
              _placeMinersList([...alreadyPlaced, selMiner], testRooms)

              const simPower = this._simulateTotals(testRooms, simActiveRooms).totalPower
              if (simPower > bestOptionPower) {
                bestOptionPower = simPower
                bestOption = { rackInfo: ri, toRemove: subset }
              }
            }
          }

          if (!bestOption) { swapOk = false; break }

          // Apply this removal
          for (const rm of bestOption.toRemove) {
            allRemovals.push(rm)
            bestOption.rackInfo.freeCells += rm.cells
          }
          bestOption.rackInfo.freeCells -= needed
        }

        if (swapOk && allRemovals.length > 0) {
          // Apply removals to sRooms
          for (const rm of allRemovals) {
            sRooms[rm.room][rm.key].miners[rm.mIdx] = null
          }
          for (let r = 1; r <= 4; r++) {
            if (!simActiveRooms[r - 1]) continue
            for (const [key, slot] of Object.entries(sRooms[r])) {
              if (slot && slot.miners) slot.miners = slot.miners.filter(m => m !== null)
            }
          }

          // Place all selected miners
          _placeMinersList(selectedMiners, sRooms)

          const swapTotals = this._simulateTotals(sRooms, simActiveRooms)
          const oldPower = this.totalPower
          const oldBonus = this.totalBonus
          return {
            toAdd: selectedMiners,
            toRemove: allRemovals.map(rm => rm.miner),
            rackChanges: [],
            newPower: swapTotals.totalPower,
            newBonus: swapTotals.totalBonus,
            oldPower, oldBonus,
            powerDelta: swapTotals.totalPower - oldPower,
            bonusDelta: swapTotals.totalBonus - oldBonus,
            simulatedRooms: sRooms
          }
        } else if (swapOk && allRemovals.length === 0) {
          // All miners fit without any removal (shouldn't reach here but safety)
          _placeMinersList(selectedMiners, sRooms)
          const swapTotals = this._simulateTotals(sRooms, simActiveRooms)
          const oldPower = this.totalPower
          const oldBonus = this.totalBonus
          return {
            toAdd: selectedMiners, toRemove: [], rackChanges: [],
            newPower: swapTotals.totalPower, newBonus: swapTotals.totalBonus,
            oldPower, oldBonus,
            powerDelta: swapTotals.totalPower - oldPower,
            bonusDelta: swapTotals.totalBonus - oldBonus,
            simulatedRooms: sRooms
          }
        }
      }

      // 5. FULL OPTIMIZATION: not enough space even after adding racks to empty slots
      const rackConfigs = this._generateRackConfigs(totalSlots)

      let bestSelected = null
      let bestEP = -1
      let bestConfig = null

      for (const config of rackConfigs) {
        const maxCells = config.reduce((s, r) => s + r.size, 0)
        const forced = minerData.filter(md => md.isForced)
        const forcedCells = forced.reduce((s, md) => s + md.cells, 0)
        if (forcedCells > maxCells) continue

        const nonForced = minerData.filter(md => !md.isForced)

        const sortFns = [
          (a, b) => b.iep - a.iep,
          (a, b) => b.power - a.power,
          (a, b) => b.bonus - a.bonus,
          (a, b) => (b.iep / b.cells) - (a.iep / a.cells)
        ]

        for (const sortFn of sortFns) {
          const selected = [...forced]
          let usedCells = forcedCells
          const sorted = [...nonForced].sort(sortFn)
          for (const md of sorted) {
            if (usedCells + md.cells <= maxCells) { selected.push(md); usedCells += md.cells }
          }
          const { ep } = this._buildRackAssignment(config, selected)
          if (ep > bestEP) { bestEP = ep; bestSelected = selected; bestConfig = config }
        }

        const hasSetRacks = config.some(r => r.is_set && r.set)
        if (hasSetRacks) {
          const committed = [...forced]
          const committedSet = new Set(forced)
          let committedCells = forcedCells
          for (const sr of config.filter(r => r.is_set && r.set)) {
            const candidates = nonForced
              .filter(m => m._effectiveSet === sr.set && !committedSet.has(m))
              .sort((a, b) => (b.power + b.bonus) - (a.power + a.bonus))
            let rackCells = 0
            for (const c of candidates) {
              if (committedCells + c.cells > maxCells || rackCells + c.cells > sr.size) continue
              committed.push(c); committedSet.add(c); rackCells += c.cells; committedCells += c.cells
            }
          }
          const rest = nonForced.filter(m => !committedSet.has(m)).sort((a, b) => b.iep - a.iep)
          for (const md of rest) {
            if (committedCells + md.cells <= maxCells) { committed.push(md); committedCells += md.cells }
          }
          const { ep } = this._buildRackAssignment(config, committed)
          if (ep > bestEP) { bestEP = ep; bestSelected = committed; bestConfig = config }
        }
      }

      if (!bestSelected) return null

      // Post-optimize: batch-swap on set-rack configs
      for (const config of rackConfigs) {
        if (!config.some(r => r.is_set && r.set)) continue
        const maxCells = config.reduce((s, r) => s + r.size, 0)
        const testSelected = []
        let usedCells = 0
        const sorted = [...bestSelected].sort((a, b) => b.iep - a.iep)
        for (const m of sorted) {
          if (usedCells + m.cells <= maxCells) { testSelected.push(m); usedCells += m.cells }
        }
        const ep = this._swapOptimize(testSelected, minerData, config, null)
        if (ep > bestEP) { bestEP = ep; bestSelected = testSelected; bestConfig = config }
      }

      // Build simulated rooms from assignment
      const finalResult = this._buildRackAssignment(bestConfig, bestSelected)
      for (let r = 1; r <= 4; r++) {
        if (simActiveRooms[r - 1]) simRooms[r] = {}
      }
      const rackSlotPairs = bestConfig.map((rack, idx) => ({ rack, idx }))
      rackSlotPairs.sort((a, b) => (b.rack.bonus || 0) - (a.rack.bonus || 0))
      let slotCounter = 0
      for (let r = 1; r <= 4; r++) {
        if (!simActiveRooms[r - 1]) continue
        const layout = this.getDataLayout(r)
        for (let rowIdx = 0; rowIdx < layout.length; rowIdx++) {
          for (let colIdx = 0; colIdx < layout[rowIdx].length; colIdx++) {
            if (!layout[rowIdx][colIdx]) continue
            const { rack, idx } = rackSlotPairs[slotCounter]
            const assignment = finalResult.assignments[idx]
            simRooms[r][`${rowIdx}-${colIdx}`] = { rack: { ...rack }, miners: assignment.miners.map(md => md.miner) }
            slotCounter++
          }
        }
      }

      // Detect rack changes
      const rackChanges = []
      const oldRackCounts = {}
      const newRackCounts = {}
      for (let r = 1; r <= 4; r++) {
        if (!simActiveRooms[r - 1]) continue
        Object.values(this.rooms[r]).forEach(slot => {
          if (slot?.rack) { const k = slot.rack.id || slot.rack.name; if (!oldRackCounts[k]) oldRackCounts[k] = { count: 0, rack: slot.rack }; oldRackCounts[k].count++ }
        })
        Object.values(simRooms[r]).forEach(slot => {
          if (slot?.rack) { const k = slot.rack.id || slot.rack.name; if (!newRackCounts[k]) newRackCounts[k] = { count: 0, rack: slot.rack }; newRackCounts[k].count++ }
        })
      }
      const allRackKeys = new Set([...Object.keys(oldRackCounts), ...Object.keys(newRackCounts)])
      for (const k of allRackKeys) {
        const oldQty = oldRackCounts[k]?.count || 0
        const newQty = newRackCounts[k]?.count || 0
        if (newQty > oldQty) rackChanges.push({ type: 'add', rack: newRackCounts[k].rack, qty: newQty - oldQty })
        else if (oldQty > newQty) rackChanges.push({ type: 'remove', rack: oldRackCounts[k].rack, qty: oldQty - newQty })
      }

      // Determine added/removed miners
      const newPlacedUids = new Set()
      for (let r = 1; r <= 4; r++) {
        if (!simActiveRooms[r - 1]) continue
        Object.values(simRooms[r]).forEach(slot => {
          if (slot.miners) slot.miners.forEach(m => { if (m) newPlacedUids.add(m.uid) })
        })
      }
      const toAdd = selectedMiners.filter(m => newPlacedUids.has(m.uid))
      const toRemove = Object.values(currentlyPlaced).filter(m => !newPlacedUids.has(m.uid))

      const newTotals = this._simulateTotals(simRooms, simActiveRooms)
      const oldPower = this.totalPower
      const oldBonus = this.totalBonus
      return {
        toAdd, toRemove, rackChanges,
        newPower: newTotals.totalPower, newBonus: newTotals.totalBonus,
        oldPower, oldBonus,
        powerDelta: newTotals.totalPower - oldPower,
        bonusDelta: newTotals.totalBonus - oldBonus,
        simulatedRooms: simRooms
      }
    },

    _simulateTotals(roomsState, activeRoomsState) {
      let rawPower = 0, totalBonus = 0, rackBonusExtra = 0, setPowerExtra = 0
      const seenBonus = new Set()
      for (let r = 1; r <= 4; r++) {
        if (!activeRoomsState[r - 1]) continue
        Object.values(roomsState[r]).forEach(slot => {
          if (slot.miners) {
            slot.miners.forEach(m => {
              if (m) {
                rawPower += this.parsePowerToGhs(m.power)
                const key = `${m.name}|${m.power}|${m.bonus}`
                if (!seenBonus.has(key)) {
                  seenBonus.add(key)
                  totalBonus += parseFloat(m.bonus) || 0
                }
              }
            })
          }
          if (slot.rack && slot.rack.bonus && slot.miners) {
            let slotRaw = 0
            slot.miners.forEach(m => { if (m) slotRaw += this.parsePowerToGhs(m.power) })
            rackBonusExtra += slotRaw * (slot.rack.bonus / 100)
          }
          const setBonus = this.getSlotSetBonus(slot)
          if (setBonus) {
            if (setBonus.type === 'bonus') totalBonus += setBonus.value
            else if (setBonus.type === 'power') setPowerExtra += setBonus.value
            else if (setBonus.type === 'mixed') { totalBonus += setBonus.bonus; setPowerExtra += setBonus.power }
          }
        })
      }
      return {
        totalPower: rawPower * (1 + totalBonus / 100) + rackBonusExtra + setPowerExtra,
        totalBonus,
        rawPower
      }
    },

    dismissTip(key) {
      this.hiddenTips = { ...this.hiddenTips, [key]: true }
      localStorage.setItem('roomsHiddenTips', JSON.stringify(this.hiddenTips))
    },

    openEditMiner(miner) {
      // Don't allow editing placeholder miners (not in our database)
      const dbMiner = this.findMiner(miner)
      if (!dbMiner) return

      // Use the loaded miner's power/bonus (may be a rarity variant), not the base miner
      const powerStr = miner.power || dbMiner.power
      const match = powerStr.match(/([\d.,]+)\s*(Gh\/s|Th\/s|Ph\/s|Eh\/s|Zh\/s)/i)
      this.editMiner = miner
      this.editForm = {
        name: miner.name,
        powerValue: match ? parseFloat(match[1].replace(',', '.')) : 0,
        powerUnit: match ? match[2] : 'Ph/s',
        bonus: parseFloat(miner.bonus) || 0,
        cells: miner.cells || dbMiner.cells || 2,
        can_be_sold: dbMiner.can_be_sold || false
      }
    },

    saveEditMiner() {
      const miner = this.editMiner
      if (!miner) return
      const dbMiner = this.findMiner(miner)
      if (!dbMiner) { this.editMiner = null; return }

      const oldData = { power: dbMiner.power, bonus: dbMiner.bonus, cells: dbMiner.cells, can_be_sold: dbMiner.can_be_sold }
      const newPower = `${this.editForm.powerValue.toFixed(3)} ${this.editForm.powerUnit}`

      dbMiner.power = newPower
      dbMiner.bonus = this.editForm.bonus
      dbMiner.cells = this.editForm.cells
      dbMiner.can_be_sold = this.editForm.can_be_sold

      // Save to localStorage
      const edits = JSON.parse(localStorage.getItem('minerEdits') || '{}')
      edits[dbMiner.id] = { id: dbMiner.id, name: dbMiner.name, power: dbMiner.power, bonus: dbMiner.bonus, cells: dbMiner.cells, can_be_sold: dbMiner.can_be_sold }
      localStorage.setItem('minerEdits', JSON.stringify(edits))

      // Send to Firebase for review
      try {
        push(dbRef(db, 'miners-edits'), {
          minerId: dbMiner.id,
          name: dbMiner.name,
          oldData,
          newData: { power: dbMiner.power, bonus: dbMiner.bonus, cells: dbMiner.cells, can_be_sold: dbMiner.can_be_sold },
          timestamp: Date.now()
        })
      } catch (e) { /* silent */ }

      // Update all loaded miner instances that match this miner
      const oldPower = miner.power
      const oldBonus = String(miner.bonus)
      const oldName = miner.name
      this.loadedMiners.forEach(lm => {
        if (lm.name === oldName && lm.power === oldPower && String(lm.bonus) === oldBonus) {
          lm.power = newPower
          lm.bonus = String(this.editForm.bonus)
          lm.cells = this.editForm.cells
        }
      })
      // Also update miners placed in rooms
      for (let r = 1; r <= 4; r++) {
        Object.values(this.rooms[r]).forEach(slot => {
          if (slot.miners) {
            slot.miners.forEach(m => {
              if (m && m.name === oldName && m.power === oldPower && String(m.bonus) === oldBonus) {
                m.power = newPower
                m.bonus = String(this.editForm.bonus)
                m.cells = this.editForm.cells
              }
            })
          }
        })
      }

      // Reset maps so computed properties recalculate
      this.minerImageCache = {}
      this.saveToStorage()
      this.editMiner = null
    },

    // ========== SIMULATION ==========
    toggleSimulation() {
      if (!this.simulationActive) {
        // Turning ON
        this.simulationActive = true
        this.simulationBackup = {
          rooms: JSON.parse(JSON.stringify(this.rooms)),
          activeRooms: [...this.activeRooms],
          loadedMiners: JSON.parse(JSON.stringify(this.loadedMiners))
        }
      } else {
        // Turning OFF - ask to save or discard
        this.showSaveModal = true
      }
    },
    onSimulationToggle() {
      this.toggleSimulation()
    },
    saveSimulation() {
      this.simulationActive = false
      this.simulationBackup = null
      this.showSaveModal = false
      this.saveToStorage()
    },
    discardSimulation() {
      if (this.simulationBackup) {
        this.rooms = this.simulationBackup.rooms
        this.activeRooms = this.simulationBackup.activeRooms
        this.loadedMiners = this.simulationBackup.loadedMiners
      }
      this.simulationActive = false
      this.simulationBackup = null
      this.showSaveModal = false
      this.saveToStorage()
    },

    // ========== UNDO / REDO ==========
    // Call BEFORE making changes to capture current state for change display
    recordCurrentState() {
      this.lastPower = this.totalPower
      this.lastBonus = this.totalBonus
    },

    // Call AFTER making changes to save snapshot for undo/redo
    saveSnapshot() {
      const snapshot = {
        rooms: JSON.parse(JSON.stringify(this.rooms)),
        activeRooms: [...this.activeRooms]
      }
      if (this.historyIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.historyIndex + 1)
      }
      this.history.push(snapshot)
      this.historyIndex = this.history.length - 1
    },
    undo() {
      if (this.historyIndex <= 0) return
      this.recordCurrentState()
      this.historyIndex--
      const s = this.history[this.historyIndex]
      this.rooms = JSON.parse(JSON.stringify(s.rooms))
      this.activeRooms = [...s.activeRooms]
      this.saveToStorage()
    },
    redo() {
      if (this.historyIndex >= this.history.length - 1) return
      this.recordCurrentState()
      this.historyIndex++
      const s = this.history[this.historyIndex]
      this.rooms = JSON.parse(JSON.stringify(s.rooms))
      this.activeRooms = [...s.activeRooms]
      this.saveToStorage()
    },

    // ========== MINER IMAGE RESOLUTION ==========
    normalizeName(str) {
      return str.toLowerCase()
        .replace(/[\u0027\u2019\u2018\u0060\u00B4\u2032""\-\u2013\u2014\.]/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
    },
    extractParenthesesName(str) {
      const match = str.match(/\(([^)]+)\)/)
      return match ? match[1].trim() : null
    },
    normalizeUnicode(str) { return str.normalize('NFC').replace(/\s+/g, ' ').trim() },
    normalizeApostrophes(str) { return str.replace(/[\u0027\u2019\u2018\u0060\u00B4\u2032]/g, "'") },
    getCleanName(name) {
      return name.replace(/^(Unreal|Legendary|Epic|Rare|Uncommon|Legacy)\s+/gi, '').trim()
    },
    getRarityLevel(name) {
      const l = name.toLowerCase()
      if (l.startsWith('unreal ')) return 6
      if (l.startsWith('legendary ')) return 5
      if (l.startsWith('epic ')) return 4
      if (l.startsWith('rare ')) return 3
      if (l.startsWith('uncommon ')) return 2
      if (l.startsWith('legacy ')) return 'legacy'
      return null
    },
    getLevelIcon(name) {
      const level = this.getRarityLevel(name)
      if (!level) return ''
      if (level === 'legacy') return `${this.storagePath}others/legacy.png`
      return `${this.storagePath}others/level_${level}.png`
    },
    findMiner(item) {
      // Fast path: by ID
      if (item.minerId && this.minerIdMap[item.minerId]) {
        return this.minerIdMap[item.minerId]
      }

      const cleanName = this.normalizeUnicode(this.getCleanName(item.name))
      const normalizedClean = this.normalizeName(cleanName)

      // Fast path: normalized name map
      if (this.minerNameMap[normalizedClean]) {
        return this.minerNameMap[normalizedClean]
      }

      // Parentheses name
      const parenthesesName = this.extractParenthesesName(cleanName)
      if (parenthesesName) {
        const np = this.normalizeName(parenthesesName)
        if (this.minerNameMap[np]) return this.minerNameMap[np]
      }

      // Slow fallback: partial match (only if fast paths failed)
      let found = this.miners.find(m => {
        const mn = this.normalizeName(m.name)
        return mn.includes(normalizedClean) || normalizedClean.includes(mn)
      })
      return found || null
    },
    getMinerImageUrl(item) {
      const cacheKey = item.uid || item.minerId || item.name
      if (this.minerImageCache[cacheKey] !== undefined) return this.minerImageCache[cacheKey]

      const miner = this.findMiner(item)
      const url = miner && miner.filename ? `${this.storagePath}miner/${miner.filename}` : defaultMinerImg
      this.minerImageCache[cacheKey] = url
      return url
    },
    isDefaultMinerImg(item) {
      return this.getMinerImageUrl(item) === defaultMinerImg
    },
    getAssetUrl(path) { return `${this.storagePath}${path}` },
    getRackImageUrl(rack) {
      return `${this.storagePath}rack/${rack.id}.png`
    },
    // ========== DRAG/SWIPE TO CHANGE ROOM ==========
    onDragStart(e) {
      this.dragStartX = e.clientX
      this.isDragging = true
    },
    onTouchStart(e) {
      this.dragStartX = e.touches[0].clientX
      this.isDragging = true
    },
    onDragMove(e) {
      if (!this.isDragging) return
      e.preventDefault()
    },
    onTouchMove(e) {
      if (!this.isDragging) return
    },
    onDragEnd(e) {
      if (this.dragItem) { this.isDragging = false; return }
      if (!this.isDragging || this.dragStartX === null) {
        this.isDragging = false
        return
      }
      const endX = e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX
      const diff = endX - this.dragStartX
      const threshold = 60

      if (Math.abs(diff) > threshold) {
        if (diff < 0) {
          // Swiped left -> next room
          this.swipeToRoom(1)
        } else {
          // Swiped right -> previous room
          this.swipeToRoom(-1)
        }
      }

      this.isDragging = false
      this.dragStartX = null
    },
    swipeToRoom(direction) {
      let target = this.currentRoom + direction
      // Find next active room in that direction
      while (target >= 1 && target <= 4) {
        if (this.activeRooms[target - 1]) {
          this.selectRoom(target)
          return
        }
        target += direction
      }
    },

    // ========== SKIN SELECTOR ==========
    getRoomSkinUrl(skinId) {
      const key = `../assets/rooms/${skinId}.png`
      const mod = roomSkinImages[key]
      return mod ? mod.default : ''
    },
    selectSkin(skinId) {
      this.selectedSkin = skinId
      localStorage.setItem('rooms_skin', skinId)
    },

    closePreview() { this.previewImage = null },
    showSetTooltip(event) {
      this.hideSetTooltip()
      const el = event.currentTarget
      const rect = el.getBoundingClientRect()
      const tip = document.createElement('div')
      tip.className = 'room-miner-tooltip-fixed'
      tip.innerHTML = `<span class="tooltip-name" style="color:#ffc107">${this.t.rooms?.set_power_note || ''}</span>`
      tip.style.left = rect.left + rect.width / 2 + 'px'
      tip.style.top = '-9999px'
      document.body.appendChild(tip)
      const tipRect = tip.getBoundingClientRect()
      tip.style.top = (rect.bottom + 8) + 'px'
      // Arrow points up
      tip.classList.add('tooltip-down')
      this._setTooltip = tip
    },
    hideSetTooltip() {
      if (this._setTooltip) { document.body.removeChild(this._setTooltip); this._setTooltip = null }
    },
    getHiwImage(path) {
      const key = `../assets/${path}`
      const mod = hiwImages[key]
      return mod ? mod.default : ''
    },

    hiwNext() {
      if (this.hiwDetail < this.howItWorksData[this.hiwSection].details.length - 1) {
        this.hiwDetail++
      } else if (this.hiwSection < this.howItWorksData.length - 1) {
        this.hiwSection++
        this.hiwDetail = 0
        this.$nextTick(() => this.hiwScrollTab())
      }
    },
    hiwPrev() {
      if (this.hiwDetail > 0) {
        this.hiwDetail--
      } else if (this.hiwSection > 0) {
        this.hiwSection--
        this.hiwDetail = this.howItWorksData[this.hiwSection].details.length - 1
        this.$nextTick(() => this.hiwScrollTab())
      }
    },
    hiwScrollTab() {
      const container = document.querySelector('.hiw-tabs')
      const active = container && container.querySelector('.hiw-tab.active')
      if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    },
    closeHiw() {
      this.showHowItWorks = false
      if (this.hiwFirstTime) {
        this.hiwFirstTime = false
        localStorage.setItem('rooms_hiw_seen', '1')
      }
      this.hiwSection = 0
      this.hiwDetail = 0
    },

    // ========== STORAGE ==========
    saveToStorage() {
      localStorage.setItem('rooms_state', JSON.stringify({
        loadedMiners: this.loadedMiners,
        rooms: this.rooms,
        activeRooms: this.activeRooms,
        userRacks: this.userRacks
      }))
    },
    _refreshMinerData(miner) {
      const dbMiner = this.findMiner(miner)
      if (dbMiner) {
        miner.cells = dbMiner.cells || 2
        miner.minerId = dbMiner.id
        miner.isSet = dbMiner.is_set || false
        miner.setName = (dbMiner.is_set && dbMiner.set) ? dbMiner.set : null
      } else {
        if (miner.cells === undefined) miner.cells = 2
        if (miner.setName === undefined) miner.setName = null
      }
      return miner
    },
    loadFromStorage() {
      const saved = localStorage.getItem('rooms_state')
      if (saved) {
        try {
          const state = JSON.parse(saved)
          if (state.loadedMiners) {
            this.loadedMiners = state.loadedMiners.map(m => this._refreshMinerData(m))
          }
          if (state.rooms) {
            // Refresh miners placed in rooms too
            for (const r of [1, 2, 3, 4]) {
              if (!state.rooms[r]) continue
              Object.values(state.rooms[r]).forEach(slot => {
                if (slot.miners) {
                  slot.miners = slot.miners.map(m => m ? this._refreshMinerData(m) : m)
                }
              })
            }
            this.rooms = state.rooms
          }
          if (state.activeRooms) this.activeRooms = state.activeRooms
          if (state.userRacks) this.userRacks = state.userRacks
        } catch (e) { /* ignore */ }
      }
      this.minerImageCache = {}
      const skin = localStorage.getItem('rooms_skin')
      if (skin) this.selectedSkin = skin
    }
  }
}
</script>
