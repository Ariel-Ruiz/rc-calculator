<template>
  <div class="rooms-page">
    <!-- Loading overlay -->
    <div v-if="loading" class="rooms-loading-overlay">
      <div class="rooms-loading-spinner"></div>
    </div>
    <!-- ========== LEFT PANEL - IMPORT ========== -->
    <div class="rooms-import">
      <h1 class="event-title">{{ t.rooms?.title }}</h1>

      <img
        :src="exampleImage"
        :alt="t.rooms?.import_example_alt"
        class="rooms-import-example"
        @click="previewImage = exampleImage"
      />

      <textarea
        v-model="importText"
        class="rooms-textarea"
        :placeholder="t.rooms?.placeholder"
      ></textarea>

      <button class="rooms-btn-add rooms-btn-full" @click="addMiners">{{ t.rooms?.add }}</button>

      <div class="rooms-import-buttons">
        <button class="rooms-btn-clear-rooms" @click="showClearRoomsConfirm = true">{{ t.rooms?.clear_rooms }}</button>
        <button class="rooms-btn-clear" @click="showClearConfirm = true">{{ t.rooms?.clear_all }}</button>
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
            <span class="rooms-set-name">{{ set.name }}</span>
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
          <p class="rooms-description">{{ t.rooms?.description }}</p>
        </div>

        <div class="rooms-sim-area">
          <!-- Simulation toggle button (separate) -->
          <button
            :class="['rooms-sim-btn', { active: simulationActive }]"
            @click="toggleSimulation"
          >
            {{ simulationActive ? t.rooms?.simulation_on_label : t.rooms?.simulation_off_label }}
          </button>

          <!-- Stats block -->
          <div class="rooms-stats-block">
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
                  {{ Math.abs(bonusChange).toFixed(2) }}%
                </span>
              </div>
            </div>
            <!-- Raw miners power -->
            <div class="rooms-raw-power-bar">
              <span class="rooms-raw-power-text">{{ t.rooms?.miners_power }}: {{ formatPower(rawPower) }}</span>
            </div>
            <!-- Miners count + undo/redo -->
            <div class="rooms-miners-count-bar">
              <span class="rooms-miners-count-text">{{ t.rooms?.total_miners_in_rooms }}: {{ totalMinersInRooms }}</span>
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
              <div class="rooms-grid">
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
                      :class="['room-rack-cell', cell.isSlot ? 'has-slot' : 'empty-slot']"
                    >
                      <template v-if="cell.isSlot">
                        <!-- Rack image as base layer -->
                        <div class="room-rack-inner">
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
                                :class="['room-miner-cell', { 'span-2': minerSlot.span === 2 }]"
                              >
                                <template v-if="minerSlot.miner">
                                  <img
                                    :src="getMinerImageUrl(minerSlot.miner)"
                                    :alt="minerSlot.miner.name"
                                    class="miner-thumb"
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
                                      v-if="minerSlot.miner.isSet"
                                      :src="getAssetUrl('others/set.png')"
                                      alt="set"
                                      class="room-badge-icon"
                                    />
                                  </div>
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
        <span class="rooms-how-icon">&#128161;</span>
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

      <!-- Manual mode toggle -->
      <button
        :class="['rooms-manual-btn', { active: manualMode }]"
        @click="manualMode = !manualMode"
      >
        {{ manualMode ? t.rooms?.manual_on_label : t.rooms?.manual_off_label }}
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
            <div class="rooms-auto-row">
              <span class="rooms-auto-label">{{ t.rooms?.order_by }}</span>
              <div class="rooms-auto-order">
                <button
                  :class="['rooms-auto-order-btn', { active: autoOrderBy === 'power' }]"
                  @click="autoOrderBy = 'power'"
                >{{ t.rooms?.power }}</button>
                <button
                  :class="['rooms-auto-order-btn', { active: autoOrderBy === 'bonus' }]"
                  @click="autoOrderBy = 'bonus'"
                >{{ t.rooms?.bonus }}</button>
              </div>
            </div>

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

            <div class="rooms-auto-checkbox">
              <input type="checkbox" id="auto-empty-rooms" v-model="autoEmptyRooms" class="room-checkbox" />
              <label for="auto-empty-rooms">{{ t.rooms?.empty_rooms_before }}</label>
            </div>

            <button class="rooms-auto-go" @click="runAutoFill">{{ t.rooms?.go }}</button>
          </div>
        </template>

        <!-- ===== MINERS ===== -->
        <template v-else-if="mode === 'miners'">
          <div class="rooms-list-panel">
            <div class="rooms-list-header">
              {{ t.rooms?.select_miners }}
              <div class="rooms-list-header-note">{{ t.rooms?.select_miners_note }}</div>
            </div>
            <div class="rooms-list-controls">
              <input
                type="text"
                class="rooms-list-search"
                :placeholder="t.rooms?.search"
                v-model="minerSearch"
              />
              <!-- <button class="rooms-list-btn" @click="showAddModal = 'miners'">{{ t.rooms?.add }}</button> -->
              <div class="rooms-sort-wrapper">
                <button class="rooms-list-btn" @click="showMinerSort = !showMinerSort">{{ t.rooms?.sort }}</button>
                <div v-if="showMinerSort" class="rooms-sort-menu">
                  <div :class="['rooms-sort-option', { active: minerSortBy === 'power-desc' }]" @click="minerSortBy = 'power-desc'; showMinerSort = false">Power &#9660;</div>
                  <div :class="['rooms-sort-option', { active: minerSortBy === 'power-asc' }]" @click="minerSortBy = 'power-asc'; showMinerSort = false">Power &#9650;</div>
                  <div :class="['rooms-sort-option', { active: minerSortBy === 'bonus-desc' }]" @click="minerSortBy = 'bonus-desc'; showMinerSort = false">Bonus &#9660;</div>
                  <div :class="['rooms-sort-option', { active: minerSortBy === 'bonus-asc' }]" @click="minerSortBy = 'bonus-asc'; showMinerSort = false">Bonus &#9650;</div>
                </div>
              </div>
            </div>
            <div v-if="filteredAvailableMiners.length > 0" class="rooms-list-grid">
              <div
                v-for="miner in sortedAvailableMiners"
                :key="miner.uid"
                :class="['rooms-list-card', { 'added-manually': miner.addedManually }]"
              >
                <button class="rooms-list-card-delete" @click="removeMiner(miner)">&times;</button>
                <span class="rooms-list-card-quantity">{{ (miner.cells || 1) === 1 ? '1 cell' : '2 cells' }}</span>
                <div class="rooms-list-card-img-area">
                  <div class="rooms-list-card-miner-row">
                    <img
                      v-if="getMinerImageUrl(miner)"
                      :src="getMinerImageUrl(miner)"
                      :alt="miner.name"
                      class="rooms-list-card-miner-img"
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
                        v-if="miner.isSet"
                        :src="getAssetUrl('others/set.png')"
                        alt="set"
                        class="badge-icon"
                      />
                    </div>
                  </div>
                </div>
                <div class="rooms-list-card-info">
                  <div class="rooms-list-card-name" :title="getCleanName(miner.name)">{{ getCleanName(miner.name) }}</div>
                  <div class="rooms-list-card-stats">
                    <span class="rooms-list-card-power">{{ miner.power }}</span>
                    <span class="rooms-list-card-sep">|</span>
                    <span class="rooms-list-card-bonus">{{ miner.bonus }}%</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="rooms-list-empty">
              {{ t.rooms?.no_miners }}
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
                :class="['rooms-list-card', { 'added-manually': rack.addedManually, 'removing': rackRemovalId === (rack.id || rack.name) }]"
              >
                <button class="rooms-list-card-delete" @click="startRackRemoval(rack)">&times;</button>
                <span class="rooms-list-card-quantity">{{ rack.available }}</span>
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
                  <div class="rooms-list-card-stats">
                    <span class="rooms-list-card-power">{{ rack.size }} cells</span>
                    <template v-if="rack.bonus > 0">
                      <span class="rooms-list-card-sep">|</span>
                      <span class="rooms-list-card-bonus">{{ rack.bonus }}%</span>
                    </template>
                  </div>
                </div>
                <!-- Removal overlay -->
                <div v-if="rackRemovalId === (rack.id || rack.name)" class="rooms-rack-remove-overlay">
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
    <div v-if="showHowItWorks" class="rooms-modal-overlay" @click="showHowItWorks = false">
      <div class="rooms-modal" @click.stop>
        <button class="rooms-modal-close" @click="showHowItWorks = false">&times;</button>
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
  </div>
</template>

<script>
import '../styles/rooms.css'
import exampleCollection from '../assets/example_collection.png'
import minersData from '../assets/miners.json'
import racksData from '../assets/racks.json'
import setsData from '../assets/sets.json'
import roomSkinsData from '../assets/rooms.json'

// Import all room skin images
const roomSkinImages = import.meta.glob('../assets/rooms/*.png', { eager: true })

// Room layouts: true = rack slot, false = empty
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

export default {
  name: 'Rooms',
  inject: ['i18n'],
  data() {
    return {
      storagePath: 'https://storage.googleapis.com/rc-calculator-d20ac.firebasestorage.app/',
      exampleImage: exampleCollection,
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
      autoOrderBy: 'power',
      autoMaxPower: null,
      autoEmptyRooms: true,
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
      racksDefinitions: racksData,
      specialRackIds: ['66d575abd864b944e0a13b78'],
      narrowRackIds: ["69490713568b0838531375a8", "690a70aae6988d19928d7101", "6825aaa7e2da6536108ec08e", "66fa99502d94b5111cd82dd4", "66fa99512d94b5111cd82dd5", "684957c04df6651d4d5db391", "66fa99522d94b5111cd82dd6", "673481872593c7f3e68fcc9a", "6752f0a50b2ea70a05bc1c5c", "67c574e988262b01d3b36b8f", "687953dc850c0148212ddf82", "68dbc757c05c26894e019db2", "69777907ce7eeebdbd02fee0", "68109bc36cce9be19c451f58", "687953d5850c0148212ddf81", "6938408e4dba654aa4065fd9", "68dbc757c05c26894e019db1"],
      setsDefinitions: setsData,
      userRacks: [],
      rackRemovalId: null,
      rackRemovalQty: 1,
      rackRemovalMax: 1
    }
  },
  watch: {
    minerSearch(val) {
      clearTimeout(this.minerSearchTimer)
      this.minerSearchTimer = setTimeout(() => {
        this.minerSearchDebounced = val
      }, 200)
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
    rightPanelStyle() {
      if (this.centerHeight > 0) {
        return { height: this.centerHeight + 'px' }
      }
      return {}
    },
    currentRoomLayout() {
      return this.currentRoom === 1 ? ROOM_1_LAYOUT : ROOM_DEFAULT_LAYOUT
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
      if (!this.minerSearchDebounced.trim()) return this.availableMiners
      const search = this.minerSearchDebounced.toLowerCase()
      return this.availableMiners.filter(m =>
        this.getCleanName(m.name).toLowerCase().includes(search)
      )
    },
    sortedAvailableMiners() {
      const list = [...this.filteredAvailableMiners]
      switch (this.minerSortBy) {
        case 'power-desc': return list.sort((a, b) => this.parsePowerToGhs(b.power) - this.parsePowerToGhs(a.power))
        case 'power-asc': return list.sort((a, b) => this.parsePowerToGhs(a.power) - this.parsePowerToGhs(b.power))
        case 'bonus-desc': return list.sort((a, b) => (parseFloat(b.bonus) || 0) - (parseFloat(a.bonus) || 0))
        case 'bonus-asc': return list.sort((a, b) => (parseFloat(a.bonus) || 0) - (parseFloat(b.bonus) || 0))
        default: return list
      }
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
    totalBonus() {
      let total = 0
      for (let r = 1; r <= 4; r++) {
        if (!this.activeRooms[r - 1]) continue
        Object.values(this.rooms[r]).forEach(slot => {
          // Miner individual bonuses
          if (slot.miners) {
            slot.miners.forEach(m => { if (m) total += parseFloat(m.bonus) || 0 })
          }
          // Set level bonus (type "bonus" or mixed)
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
    this.$nextTick(() => {
      this._resizeObserver = new ResizeObserver(() => {
        if (this.$refs.centerPanel) {
          this.centerHeight = this.$refs.centerPanel.offsetHeight
        }
      })
      if (this.$refs.centerPanel) {
        this._resizeObserver.observe(this.$refs.centerPanel)
        this.centerHeight = this.$refs.centerPanel.offsetHeight
      }
    })
  },
  beforeDestroy() {
    if (this._resizeObserver) this._resizeObserver.disconnect()
  },
  methods: {
    // ========== IMPORT / PARSE ==========
    parseCollectionInput(text) {
      const miners = []
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
      let uidCounter = Date.now()
      let i = 0

      while (i < lines.length) {
        if ((lines[i].match(/^product\d*$/i) && !lines[i].includes('set badge')) ||
            lines[i] === 'In collection' ||
            lines[i].match(/^productRating star$/i)) {
          i++
          continue
        }

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
            const idMatch = idLine.match(/^[a-f0-9]{24}/i)

            if (idMatch) {
              minerId = idMatch[0]
              isSet = isSetBadge
              const cleanId = idLine.replace('set badge', '').replace('Rating star', '').trim()
              if (cleanId.length > 24) {
                const afterId = cleanId.slice(24)
                const rarityMatch = afterId.match(/^[1-5]$/)
                if (rarityMatch) {
                  const rarityMap = { '1': 'Uncommon', '2': 'Rare', '3': 'Epic', '4': 'Legendary', '5': 'Unreal' }
                  rarity = rarityMap[rarityMatch[0]] || ''
                }
              }

              let nameIndex = i + 2
              if (isSet && nameIndex < lines.length) {
                if (lines[nameIndex].toLowerCase().endsWith(' set')) nameIndex++
              }

              if (nameIndex < lines.length) {
                name = lines[nameIndex]
                if (isLegacy) name = `Legacy ${name}`
                else if (rarity) name = `${rarity} ${name}`
              }

              for (let j = nameIndex + 1; j < Math.min(i + 12, lines.length); j++) {
                const powerMatch = lines[j].match(/^([\d.,]+)\s*(Gh\/s|Th\/s|Ph\/s|Eh\/s)$/i)
                if (powerMatch) power = `${powerMatch[1]} ${powerMatch[2]}`
                if (lines[j] === 'Miner details') break
              }

              if (name && power) {
                const dbMiner = this.findMiner({ name, minerId })
                const cells = dbMiner ? dbMiner.cells : 1
                const setName = (dbMiner && dbMiner.is_set && dbMiner.set) ? dbMiner.set : null
                miners.push({
                  uid: uidCounter++, name, power, bonus, isSet, isLegacy, minerId, cells, setName, source: 'COLLECTION'
                })
              }
            }
          }
          i++
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
        const newMiners = this.parseCollectionInput(this.importText)
        if (newMiners.length > 0) {
          newMiners.forEach(newMiner => {
            const exists = this.loadedMiners.find(m =>
              m.name === newMiner.name && m.power === newMiner.power && m.bonus === newMiner.bonus
            )
            if (!exists) this.loadedMiners.push(newMiner)
          })
          this.importText = ''
          this.minerImageCache = {}
          this.saveToStorage()
        }
        this.loading = false
      }, 50)
    },

    clearImport() { this.importText = '' },

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
      if (this.rackRemovalId === key) {
        // Cancel removal
        this.rackRemovalId = null
        return
      }
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
    confirmRackRemoval() {
      const ur = this.userRacks.find(r => (r.id || r.name) === this.rackRemovalId)
      if (ur) {
        ur.quantity -= this.rackRemovalQty
        if (ur.quantity <= 0) {
          const idx = this.userRacks.indexOf(ur)
          this.userRacks.splice(idx, 1)
        }
      }
      this.rackRemovalId = null
      this.saveToStorage()
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
          const dbMiner = this.miners.find(m => m.id === minerId)
          if (!dbMiner) continue
          const exists = this.loadedMiners.find(m => m.minerId === minerId)
          if (exists) continue
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
      const slot = this.rooms[roomNum][`${rowIdx}-${colIdx}`]
      return slot ? slot.rack : null
    },

    getRackMiners(roomNum, rowIdx, colIdx) {
      const slot = this.rooms[roomNum][`${rowIdx}-${colIdx}`]
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
      const match = powerStr.match(/([\d.,]+)\s*(Gh\/s|Th\/s|Ph\/s|Eh\/s)/i)
      if (!match) return 0
      const value = parseFloat(match[1].replace(',', '.'))
      const unit = match[2].toLowerCase()
      if (unit.includes('eh')) return value * 1e9
      if (unit.includes('ph')) return value * 1e6
      if (unit.includes('th')) return value * 1e3
      return value
    },

    formatPower(ghsValue) {
      if (Math.abs(ghsValue) >= 1e9) return `${(ghsValue / 1e9).toFixed(3)} Eh/s`
      if (Math.abs(ghsValue) >= 1e6) return `${(ghsValue / 1e6).toFixed(3)} Ph/s`
      if (Math.abs(ghsValue) >= 1e3) return `${(ghsValue / 1e3).toFixed(3)} Th/s`
      return `${ghsValue.toFixed(3)} Gh/s`
    },

    // ========== SET BONUS CALCULATION ==========
    // Get the set name for a loaded miner
    getMinerSetName(miner) {
      if (!miner) return null
      // Use stored setName first (fastest)
      if (miner.setName) return miner.setName
      // Fallback: lookup in database
      const dbMiner = this.findMiner(miner)
      if (dbMiner && dbMiner.is_set && dbMiner.set) return dbMiner.set
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

    // Calculate full EP from rack assignments
    _calcFullPower(assignments) {
      const setMap = this._getSetMap()
      let rawTotal = 0, bonusTotal = 0, rackExtra = 0, setPowerExtra = 0
      for (let i = 0; i < assignments.length; i++) {
        const ra = assignments[i]
        let slotRaw = 0
        for (let j = 0; j < ra.miners.length; j++) {
          const m = ra.miners[j]
          rawTotal += m.power
          bonusTotal += m.bonus
          slotRaw += m.power
        }
        if (ra.rackBonus) rackExtra += slotRaw * ra.rackBonus / 100
        if (ra.setName) {
          const setDef = setMap[ra.setName]
          if (setDef) {
            let cnt = 0
            for (let j = 0; j < ra.miners.length; j++) {
              if (ra.miners[j].setName === ra.setName) cnt++
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
      return rawTotal * (1 + bonusTotal / 100) + rackExtra + setPowerExtra
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

      // Pass 1: set miners into matching set racks
      for (const idx of setIdxs) {
        const ra = assignments[idx]
        for (let j = 0; j < miners.length; j++) {
          const m = miners[j]
          if (used.has(j) || m.setName !== ra.setName || ra.used + m.cells > ra.size) continue
          ra.miners.push(m); used.add(j); ra.used += m.cells
        }
      }

      // Pass 2: remaining miners, prefer highest bonus racks
      // Pre-sort assignment indices by bonus desc
      const sortedIdxs = []
      for (let i = 0; i < assignments.length; i++) sortedIdxs.push(i)
      sortedIdxs.sort((a, b) => assignments[b].rackBonus - assignments[a].rackBonus)

      for (let j = 0; j < miners.length; j++) {
        if (used.has(j)) continue
        const m = miners[j]
        for (const idx of sortedIdxs) {
          const ra = assignments[idx]
          if (ra.used + m.cells <= ra.size) {
            ra.miners.push(m); used.add(j); ra.used += m.cells; break
          }
        }
      }

      return { assignments, ep: this._calcFullPower(assignments) }
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
          // Quick check with estimate
          if (this._fastEP(selected) > maxPowerGhs) {
            // Verify with full calc
            if (this._buildRackAssignment(rackConfigs, selected).ep > maxPowerGhs) {
              selected.pop(); totalCells -= m.cells
            }
          }
        }
      }

      return { selected, ep: this._buildRackAssignment(rackConfigs, selected).ep }
    },

    // Marginal greedy (limited candidates per step for performance)
    _greedyMarginalWithRacks(minerData, rackConfigs, maxPowerGhs) {
      const remaining = [...minerData]
      const selected = []
      let totalCells = 0
      const maxCells = rackConfigs.reduce((s, r) => s + r.size, 0)
      let currentEP = 0
      const TOP_N = Math.min(40, remaining.length)

      while (remaining.length > 0 && totalCells < maxCells) {
        // Only evaluate top N by iep for speed
        remaining.sort((a, b) => b.iep - a.iep)
        const limit = Math.min(TOP_N, remaining.length)
        let bestIdx = -1, bestEP = currentEP

        for (let i = 0; i < limit; i++) {
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

      // Try committing set miners for each set rack
      const committed = []
      const committedSet = new Set()
      let committedCells = 0

      for (const sr of setRacks) {
        const setName = sr.set
        // Get ALL miners of this set, sorted by best contribution
        const candidates = minerData
          .filter(m => m.setName === setName && !committedSet.has(m))
          .sort((a, b) => (b.power + b.bonus) - (a.power + a.bonus))

        let rackCells = 0
        for (const c of candidates) {
          if (rackCells + c.cells <= sr.size) {
            committed.push(c)
            committedSet.add(c)
            rackCells += c.cells
            committedCells += c.cells
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
          const testMiners = [...selected, m]
          const { ep } = this._buildRackAssignment(rackConfigs, testMiners, null)
          if (maxPowerGhs !== null && ep > maxPowerGhs) continue
          selected.push(m)
          totalCells += m.cells
        }

        const { ep } = this._buildRackAssignment(rackConfigs, selected, null)
        results.push({ selected, ep })
      }

      // Also try marginal greedy after commit
      const marginalSelected = [...committed]
      let marginalCells = committedCells
      const marginalRemaining = [...remaining]
      let currentEP = this._buildRackAssignment(rackConfigs, marginalSelected, null).ep

      while (marginalRemaining.length > 0 && marginalCells < maxCells) {
        let bestIdx = -1, bestEP = currentEP
        for (let i = 0; i < marginalRemaining.length; i++) {
          const m = marginalRemaining[i]
          if (marginalCells + m.cells > maxCells) continue
          const test = [...marginalSelected, m]
          const { ep } = this._buildRackAssignment(rackConfigs, test, null)
          if (maxPowerGhs !== null && ep > maxPowerGhs) continue
          if (ep > bestEP) { bestEP = ep; bestIdx = i }
        }
        if (bestIdx === -1) break
        marginalSelected.push(marginalRemaining.splice(bestIdx, 1)[0])
        marginalCells += marginalSelected[marginalSelected.length - 1].cells
        currentEP = bestEP
      }
      results.push({ selected: marginalSelected, ep: currentEP })

      // Return best result
      let best = results[0]
      for (const r of results) {
        if (r.ep > best.ep) best = r
      }
      return best
    },

    // Generate rack configurations to try
    _generateRackConfigs(totalSlots) {
      const available = []
      for (const ur of this.allUserRacks) {
        const qty = ur.quantity || 0
        if (qty > 0) available.push({ ...ur, qty: Math.min(qty, totalSlots) })
      }

      const regular = this.racksDefinitions.find(r => r.name === 'Regular Rack 8')
      const configs = []

      // Helper to fill remaining slots with regular rack
      const fillRegular = (config) => {
        while (config.length < totalSlots && regular) {
          config.push({ ...regular, bonus: 0, size: 8, is_set: false, set: null })
        }
        return config
      }

      // Config 1: all Regular Rack 8
      if (regular) {
        configs.push(fillRegular([]))
      }

      // Config 2: all bonus racks (including set racks) sorted by bonus desc, fill rest regular
      const bonusRacks = available.filter(r => (r.bonus || 0) > 0).sort((a, b) => (b.bonus || 0) - (a.bonus || 0))
      if (bonusRacks.length > 0) {
        const config = []
        for (const br of bonusRacks) {
          for (let i = 0; i < br.qty && config.length < totalSlots; i++) {
            config.push({ ...br })
          }
        }
        configs.push(fillRegular(config))
      }

      // Config 3: only 8-cell bonus racks, fill rest regular
      const bonus8 = bonusRacks.filter(r => r.size === 8)
      if (bonus8.length > 0) {
        const config = []
        for (const br of bonus8) {
          for (let i = 0; i < br.qty && config.length < totalSlots; i++) {
            config.push({ ...br })
          }
        }
        configs.push(fillRegular(config))
      }

      // Config 4: set racks + highest bonus non-set racks, fill rest regular
      const setRacks = available.filter(r => r.is_set)
      if (setRacks.length > 0) {
        const config = []
        // Add set racks first
        for (const sr of setRacks) {
          for (let i = 0; i < sr.qty && config.length < totalSlots; i++) {
            config.push({ ...sr })
          }
        }
        // Then non-set bonus racks
        const nonSetBonus = bonusRacks.filter(r => !r.is_set)
        for (const br of nonSetBonus) {
          for (let i = 0; i < br.qty && config.length < totalSlots; i++) {
            config.push({ ...br })
          }
        }
        configs.push(fillRegular(config))
      }

      // Config 5: only set racks, fill rest regular (to test set-only benefit)
      if (setRacks.length > 0) {
        const config = []
        for (const sr of setRacks) {
          for (let i = 0; i < sr.qty && config.length < totalSlots; i++) {
            config.push({ ...sr })
          }
        }
        configs.push(fillRegular(config))
      }

      return configs
    },

    runAutoFill() {
      this.loading = true
      this.recordCurrentState()
      setTimeout(() => { this._doAutoFill() }, 50)
    },

    _doAutoFill() {
      // 1. Clear all active rooms
      for (let r = 1; r <= 4; r++) {
        if (this.activeRooms[r - 1]) this.$set(this.rooms, r, {})
      }

      // 2. Count rack slots
      let totalSlots = 0
      for (let r = 1; r <= 4; r++) {
        if (!this.activeRooms[r - 1]) continue
        const layout = r === 1 ? ROOM_1_LAYOUT : ROOM_DEFAULT_LAYOUT
        layout.forEach(row => row.forEach(cell => { if (cell) totalSlots++ }))
      }
      if (totalSlots === 0) { this.loading = false; return }

      const maxPowerGhs = this.autoMaxPower ? this.autoMaxPower * 1e9 : null

      // 3. Prepare miner data (setName already stored on each miner)
      const minerData = this.loadedMiners.map(m => ({
        miner: m,
        power: this.parsePowerToGhs(m.power),
        bonus: parseFloat(m.bonus) || 0,
        cells: m.cells || 1,
        iep: this.parsePowerToGhs(m.power) * (1 + (parseFloat(m.bonus) || 0) / 100),
        setName: m.setName || null
      }))

      // 4. Generate rack configurations to try
      const rackConfigs = this._generateRackConfigs(totalSlots)

      // 5. For each rack config, try multiple strategies and keep the best
      let bestResult = null
      let bestConfig = null

      for (const config of rackConfigs) {
        const hasSetRacks = config.some(r => r.is_set && r.set)
        const strategies = [
          this._greedyMarginalWithRacks(minerData, config, maxPowerGhs),
          this._greedySelectWithRacks(minerData, config, maxPowerGhs, (a, b) => b.iep - a.iep),
          this._greedySelectWithRacks(minerData, config, maxPowerGhs, (a, b) => b.power - a.power),
          this._greedySelectWithRacks(minerData, config, maxPowerGhs, (a, b) => b.bonus - a.bonus),
          this._greedySelectWithRacks(minerData, config, maxPowerGhs, (a, b) => (b.iep / b.cells) - (a.iep / a.cells)),
          ...(hasSetRacks ? [this._greedyWithSetCommit(minerData, config, maxPowerGhs)] : [])
        ]

        for (const s of strategies) {
          if (!bestResult || s.ep > bestResult.ep) {
            bestResult = s
            bestConfig = config
          }
        }
      }

      if (!bestResult || bestResult.selected.length === 0) {
        this.saveSnapshot()
        this.saveToStorage()
        this.loading = false
        return
      }

      // 6. Assign racks to room slots
      const sortedRacks = [...bestConfig].sort((a, b) => (b.bonus || 0) - (a.bonus || 0))
      const rackSlots = []
      let rackIdx = 0
      for (let r = 1; r <= 4; r++) {
        if (!this.activeRooms[r - 1]) continue
        const layout = r === 1 ? ROOM_1_LAYOUT : ROOM_DEFAULT_LAYOUT
        for (let rowIdx = 0; rowIdx < layout.length; rowIdx++) {
          for (let colIdx = 0; colIdx < layout[rowIdx].length; colIdx++) {
            if (!layout[rowIdx][colIdx]) continue
            const rack = sortedRacks[rackIdx++] || sortedRacks[0]
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

      // Pass 1: place set miners into matching set racks (best contribution first)
      for (const rs of rackSlots) {
        if (!rs.setName) continue
        const candidates = selectedData
          .filter(md => md.setName === rs.setName && !usedUids.has(md.miner.uid))
          .sort((a, b) => (b.power + b.bonus) - (a.power + a.bonus))

        for (const md of candidates) {
          if (rs.used + md.cells > rs.size) continue
          rs.slot.miners.push(md.miner)
          usedUids.add(md.miner.uid)
          rs.used += md.cells
        }
      }

      // Pass 2: fill remaining space - highest power miners into highest bonus racks
      const remaining = selectedData
        .filter(md => !usedUids.has(md.miner.uid))
        .sort((a, b) => b.power - a.power)

      const racksByBonus = [...rackSlots].sort((a, b) => b.bonus - a.bonus)
      for (const md of remaining) {
        const rack = racksByBonus.find(rs => rs.used + md.cells <= rs.size)
        if (rack) {
          rack.slot.miners.push(md.miner)
          usedUids.add(md.miner.uid)
          rack.used += md.cells
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
      // Cache lookup
      const cacheKey = item.uid || item.minerId || item.name
      if (this.minerImageCache[cacheKey] !== undefined) return this.minerImageCache[cacheKey]

      const miner = this.findMiner(item)
      const url = miner && miner.filename ? `${this.storagePath}miner/${miner.filename}` : null
      this.minerImageCache[cacheKey] = url
      return url
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

    // ========== STORAGE ==========
    saveToStorage() {
      localStorage.setItem('rooms_state', JSON.stringify({
        loadedMiners: this.loadedMiners,
        rooms: this.rooms,
        activeRooms: this.activeRooms,
        userRacks: this.userRacks
      }))
    },
    loadFromStorage() {
      const saved = localStorage.getItem('rooms_state')
      if (saved) {
        try {
          const state = JSON.parse(saved)
          if (state.loadedMiners) {
            // Migrate: ensure all miners have setName
            this.loadedMiners = state.loadedMiners.map(m => {
              if (m.setName === undefined) {
                const dbMiner = this.findMiner(m)
                m.setName = (dbMiner && dbMiner.is_set && dbMiner.set) ? dbMiner.set : null
              }
              return m
            })
          }
          if (state.rooms) this.rooms = state.rooms
          if (state.activeRooms) this.activeRooms = state.activeRooms
          if (state.userRacks) this.userRacks = state.userRacks
        } catch (e) { /* ignore */ }
      }
      const skin = localStorage.getItem('rooms_skin')
      if (skin) this.selectedSkin = skin
    }
  }
}
</script>
