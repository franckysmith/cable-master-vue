<template>
  <div class="main">
    <!-- Grand écran : visionneuse de documents/liens de l'affaire (colonne gauche) -->
    <DocViewer :affair="selectedAffair" />
    <AddAffair
      v-if="affairIsOpen"
      :affair="editingAffair"
      @close="affairIsOpen = false; editingAffair = null"
      @created="onAffairCreated"
    />
    <Affaires
      v-else
      :all-cases-active="allCasesMode"
      :active-role="activeRole"
      @selected="onAffairSelected"
      @openNew="affairIsOpen = true; editingAffair = null"
      @edit="onAffairEdit"
      @share="shareAllFc"
      @toggle-all-cases="toggleAllCases"
      @select-role="onSelectRole"
    />


    <!-- Vue toutes les caisses -->
    <div v-if="selectedAffair && allCasesMode">
      <AllCasesView
        :groups="casesByRole"
        :cables="joinedData"
        :affair-id="selectedAffair.affairid"
        :fc-labels="fcLabels"
      />
      <div class="all-cases-actions">
        <button class="action-btn" @click="printAllCasesSummary">🖨 Imprimer</button>
        <button class="action-btn" @click="shareAllCasesSummary">📤 Partager</button>
      </div>
    </div>

    <!-- Vue d'ensemble par poste (clic technicien) : Front → Monitor → System → Stage empilés -->
    <div v-if="selectedAffair && overviewMode" class="overview">
      <div class="affair-open-bar">
        <span class="affair-open-name">{{ listName }}</span>
        <button class="affair-del-btn" @click="deleteSelectedAffair" title="Supprimer l'affaire">🗑</button>
      </div>
      <div v-if="affairTeam.length" class="ov-team">
        👥 Équipe :
        <span v-for="(p, i) in affairTeam" :key="i" class="ov-team-p" :class="{ asst: p.role === 'Assistant' }">{{ p.role }} <b>{{ p.name }}</b></span>
      </div>
      <div v-for="g in needsByRole" :key="g.role" class="ov-role">
        <div class="ov-role-head" :style="{ borderColor: g.color, color: g.color }">
          {{ g.label }}
          <button class="ov-edit" @click="editDistribution(g.role)" title="Modifier">✏️</button>
        </div>
        <div v-if="g.desc" class="ov-desc">{{ g.desc }}</div>
        <div v-for="it in g.items" :key="it.cableid" class="ov-item">
          <span class="ov-qty">{{ it.need }}</span>
          <span class="ov-name">{{ it.name }}</span>
        </div>
      </div>
      <div v-if="needsByRole.length === 0" class="ov-empty">
        Aucun besoin déclaré pour le moment.
        <button class="ov-edit-all" @click="overviewMode = false">Commencer la liste</button>
      </div>
      <div v-else class="ov-actions">
        <button class="ov-edit-all" @click="overviewMode = false">✏️ Modifier la distribution</button>
        <button class="ov-validate" @click="validateCabling">✅ Valider mon câblage</button>
      </div>
    </div>

    <div class="content-liste" v-if="selectedAffair && !allCasesMode && !overviewMode">
      <!-- Barre compacte : valider + suppression (la fiche complète est au-dessus, panneau HOME) -->
      <div class="affair-open-bar slim">
        <button v-if="!isMaster" class="ov-validate small" @click="validateCabling" title="Valider mon câblage">✅ Valider mon câblage</button>
        <button class="affair-del-btn" @click="deleteSelectedAffair" title="Supprimer l'affaire">🗑</button>
      </div>
      <!-- Mode toggle : Select / flight-case / Micro (restent visibles même en Cablekit) -->
      <div class="mode-bar" v-if="!allCasesMode">
        <button
          class="mode-btn"
          :class="{ active: !microMode && !ctMode && layout === 'cableTechBase' }"
          @click="microMode = false; ctMode = false; onHelpClick('select', () => layout = 'cableTechBase')"
        >Select</button>
        <span class="mode-arrow">⮕</span>
        <button
          class="mode-btn"
          :class="{ active: !microMode && !ctMode && layout === 'flightcase' }"
          @click="microMode = false; ctMode = false; onHelpClick('fc', () => layout = 'flightcase')"
        >flight-case</button>
        <button
          class="mode-btn"
          :class="{ active: microMode && !ctMode }"
          @click="ctMode = false; onHelpClick('micro', toggleMicroMode)"
        ><q-icon name="mic" size="16px" /> Micro</button>
      </div>
      <div class="content-button2">
        <span class="sync-dot" :class="{ saving: saving, synced: !saving }" :title="saving ? 'Synchronisation...' : 'Synchronisé'"></span>
        <span class="search-wrap">
          <input class="search" type="text" v-model="searchKey" placeholder="Rechercher élément" @focus="onHelpClick('search', () => {})" />
          <button v-if="searchKey" class="search-clear" @click="searchKey = ''" title="Effacer">✕</button>
        </span>
        <button class="add-btn" @click="onHelpClick('add', () => showAddInput = !showAddInput)">+</button>
        <button
          v-if="hasCompany"
          class="special-btn ctype-btn"
          :class="{ active: ctMode, editing: ctEditMode, disabled: !hasCtContent && !isMaster }"
          :disabled="!hasCtContent && !isMaster"
          @mousedown.prevent="startCtBtnPress"
          @mouseup.prevent="endCtBtnPress"
          @mouseleave="cancelCtBtnPress"
          @touchstart.prevent="startCtBtnPress"
          @touchend.prevent="endCtBtnPress"
          @touchcancel="cancelCtBtnPress"
          style="user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;"
        >Câble Kit</button>
      </div>

      <!-- Mode Micro : ajouter un micro manquant → section « Micro supplémentaire » -->
      <div v-if="showAddInput && microMode" class="quick-add">
        <input
          ref="addInput"
          v-model="newMicName"
          class="quick-add-input"
          placeholder="Ajouter les micros manquants…"
          @keydown.enter="quickAddMic"
        />
        <button class="quick-add-btn" @click="quickAddMic" :disabled="!newMicName.trim()">Ajouter</button>
      </div>

      <!-- Ajout rapide de câble (édition autorisée) -->
      <div v-if="showAddInput && canEditCables && !microMode" class="quick-add">
        <input
          ref="addInput"
          v-model="newCableName"
          class="quick-add-input"
          :placeholder="`Nom du câble (${typeLabel(typeChoose)})`"
          @keydown.enter="quickAddCable"
        />
        <button class="quick-add-btn" @click="quickAddCable">Ajouter</button>
      </div>

      <!-- Technicien : câble absent de la liste → demande au master -->
      <div v-if="showAddInput && !canEditCables && !microMode" class="quick-add quick-request">
        <input
          ref="addInput"
          v-model="requestText"
          class="quick-add-input"
          placeholder="Câble manquant à demander à l'entreprise…"
          @keydown.enter="sendCableRequest"
        />
        <button class="quick-add-btn" @click="sendCableRequest" :disabled="!requestText.trim()">Demander</button>
        <div v-if="requestSent" class="request-ok">✅ Demande envoyée</div>
      </div>

      <!-- Édition de câble (seulement si c'est ma liste ou si je suis master) -->
      <div v-if="editingCable" class="cable-edit-panel">
        <div class="edit-header">
          <span>{{ canEditCables ? 'Modifier' : '' }} {{ editingCable.name }}</span>
          <button class="close-btn" @click="editingCable = null">x</button>
        </div>
        <div v-if="!canEditCables" class="edit-readonly">
          <p>{{ editForm.brand ? editForm.brand + ' — ' : '' }}{{ editForm.type }}</p>
          <p class="readonly-hint">Liste de l'entreprise — modification non autorisée</p>
        </div>
        <div v-else class="edit-fields">
          <label>Nom<input v-model="editForm.name" /></label>
          <label>Type
            <select v-model="editForm.type">
              <option v-for="t in cableTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </label>
          <label>Marque<input v-model="editForm.brand" placeholder="ex: Shure, Audix..." /></label>
          <label>Poids<input v-model.number="editForm.weight" type="number" /></label>
        </div>
        <div v-if="canEditCables" class="edit-actions">
          <button class="edit-save" @click="saveEditCable">Enregistrer</button>
          <button class="edit-delete" @click="deleteEditCable">Supprimer</button>
        </div>
      </div>

      <!-- Sticky : boutons type (sélection + quantité + cadre couleur) + en-têtes colonnes -->
      <div class="sticky-header" :class="{ 'sticky-micro': microMode }">
        <ButtonCableType v-if="!microMode" :model-value="typeChoose" :distributed-types="distributedTypes" :over-types="overTypes" :counts="typeCounts" :show-calc="!ctMode && layout === 'cableTechBase'" @select="typeChoose = $event" @calc="ampWiringOpen = true" />



        <!-- Sync-header Zones -->
        <div v-if="!ctMode && !microMode && !directMode && layout === 'cableTechBase'" class="sync-header" ref="zoneHeaderScroll">
          <div class="sync-header-inner">
            <div class="head-spacer-sticky ct-btn-row">
              <button class="mini-btn" :class="{ active: subtractMode }" @click="subtractMode = !subtractMode">
                {{ subtractMode ? '−' : '+' }}
              </button>
              <button class="mini-btn" :class="{ 'active-blue': soloMode }" @click="soloMode = !soloMode; if(!soloMode) zoneSoloFilter = null">
                S
              </button>
              <button class="mini-btn" :class="{ 'active-blue': incrementStep === 10 }" @click="incrementStep = incrementStep === 10 ? 1 : 10">
                +10
              </button>
              <div class="ct-star-legend" title="Astérisque = par côté (stéréo)"><span class="csl-star">*</span><span class="csl-sub">par côté</span></div>
            </div>
            <div class="head-label-angled head-spare" @click="onSpareSolo"><span :class="{ 'solo-selected': soloMode && zoneSoloFilter === 0 }">Spare</span></div>
            <div
              v-for="i in 6" :key="'zh'+i" class="head-label-angled"
              @mousedown="startHeaderPress('zone', i)" @mouseup="endHeaderPress('zone', i)" @mouseleave="cancelHeaderPress"
              @touchstart="startHeaderPress('zone', i)" @touchmove="onHeaderMove" @touchend.prevent="endHeaderPress('zone', i)" @touchcancel="cancelHeaderPress"
            >
              <span :class="{ 'solo-selected': soloMode && zoneSoloFilter === i }"><span v-if="zoneStereo(zoneLabels[`lz${i}`])" class="zstar">*</span>{{ zoneBase(zoneLabels[`lz${i}`]) || `Zone${i}` }}</span>
            </div>
            <div class="head-total-spacer"></div>
          </div>
        </div>

        <!-- Sync-header Flight-cases -->
        <div v-if="!ctMode && !microMode && (directMode || layout === 'flightcase')" class="sync-header" ref="fcHeaderScroll">
          <div class="sync-header-inner">
            <div class="head-spacer-sticky ct-btn-row">
              <button class="mini-btn" :class="{ active: subtractMode }" @click="subtractMode = !subtractMode">
                {{ subtractMode ? '−' : '+' }}
              </button>
              <button class="mini-btn" :class="{ 'active-blue': fcSolo }" @click="fcSolo = !fcSolo; if(!fcSolo) fcSoloFilter = null">
                S
              </button>
              <button class="mini-btn" :class="{ 'active-blue': incrementStep === 10 }" @click="incrementStep = incrementStep === 10 ? 1 : 10">
                +10
              </button>
            </div>
            <div class="head-total-label">Total</div>
            <div
              v-for="i in 7" :key="'fch2'+i" class="head-label-angled-fc"
              @mousedown="startHeaderPress('fc', i)" @mouseup="endHeaderPress('fc', i)" @mouseleave="cancelHeaderPress"
              @touchstart="startHeaderPress('fc', i)" @touchmove="onHeaderMove" @touchend.prevent="endHeaderPress('fc', i)" @touchcancel="cancelHeaderPress"
            >
              <span class="fc-label-btn">{{ fcLabels[`lfc${i}`] || `FC${i}` }}</span>
            </div>
          </div>
        </div>

        <!-- Sync-header Cablekit -->
        <div v-if="ctMode" class="sync-header" ref="ctHeaderScroll">
          <div class="sync-header-inner">
            <div class="head-spacer-sticky ct-btn-row">
              <button class="mini-btn" :class="{ active: subtractMode }" @click="subtractMode = !subtractMode">
                {{ subtractMode ? '−' : '+' }}
              </button>
              <button class="mini-btn" :class="{ 'active-orange': ctSolo }" @click="ctSolo = !ctSolo; if(!ctSolo) ctSoloFilter = null">
                S
              </button>
              <button class="mini-btn" :class="{ 'active-blue': incrementStep === 10 }" @click="incrementStep = incrementStep === 10 ? 1 : 10">
                +10
              </button>
            </div>
            <div v-for="i in 7" :key="'cth'+i" class="head-label-angled-fc" @mousedown="startHeaderPress('ct', i)" @mouseup="endHeaderPress('ct', i)" @mouseleave="cancelHeaderPress" @touchstart="startHeaderPress('ct', i)" @touchend="endHeaderPress('ct', i)" @touchcancel="cancelHeaderPress">
              <span class="ct-label-btn" :class="{ 'solo-selected': ctSolo && ctSoloFilter === i }">{{ settingsStore.defaultCtLabels[`ct${i}`] || `CK${i}` }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cablekit body (outside sticky) -->
      <div v-if="ctMode" class="table-scroll" ref="ctBodyScroll" @scroll="syncScroll('ctBodyScroll','ctHeaderScroll')" style="width:100%">
        <CtypeList
          :cables="ctFilteredCables"
          :active-cable-id="ctEditMode ? activeCableId : null"
          :subtract-mode="subtractMode"
          :solo-mode="ctSolo"
          :solo-filter="ctSoloFilter"
          :increment-step="incrementStep"
          :counts="ctAllCounts"
          :read-only="!ctEditMode"
          @updated="onCtCableUpdated"
          @select="onCableSelect"
          @longpress="onCableLongPress"
        />
      </div>

      <!-- Micro layout -->
      <div v-if="!ctMode && microMode" class="micro-area" style="width:100%">
        <!-- Pop-up photo + PDF d'un micro (appui long) -->
        <div v-if="micPopup.open && micPopup.mic" class="mic-pop-ov" @click.self="micPopup.open = false">
          <div class="mic-pop">
            <div class="mic-pop-head">
              <span class="mic-pop-name">{{ micPopup.mic.name }} <small v-if="micPopup.mic.brand">· {{ micPopup.mic.brand }}</small></span>
              <button class="mic-pop-close" @click="micPopup.open = false">✕</button>
            </div>
            <img v-if="micPopup.mic.image_url" :src="micPopup.mic.image_url" class="mic-pop-img" :alt="micPopup.mic.name" />
            <div v-else class="mic-pop-noimg">🎤 Pas de photo</div>
            <div class="mic-pop-actions">
              <a v-if="micPopup.mic.link" :href="micPopup.mic.link" target="_blank" class="mic-pop-pdf">📄 Voir le PDF</a>
              <span v-else class="mic-pop-nopdf">Pas de fiche PDF</span>
            </div>
          </div>
        </div>
        <div class="table-scroll">
          <MicroList :cables="filteredJoinedData" :active-cable-id="activeCableId" :subtract-mode="subtractMode" :solo-mode="microSolo" :increment-step="incrementStep" :micros-validated="!!selectedAffair?.micros_validated" @updated="onCableUpdated" @select="onCableSelect" @longpress="onMicLongPress" @toggle-subtract="subtractMode = !subtractMode" @toggle-solo="microSolo = !microSolo" @validate="setMicrosValidated(true)" @unlock="setMicrosValidated(false)" />
        </div>
      </div>

      <!-- Zones layout (body only, header in sticky) -->
      <div v-if="!ctMode && !microMode && !directMode && layout === 'cableTechBase'" class="table-scroll" ref="zoneBodyScroll" @scroll="syncScroll('zoneBodyScroll','zoneHeaderScroll')" style="width:100%">
        <CableList :cables="filteredJoinedData" :active-cable-id="activeCableId" :visible-zones="6" :subtract-mode="subtractMode" :solo-mode="soloMode" :solo-filter="zoneSoloFilter" :increment-step="incrementStep" @updated="onCableUpdated" @select="onCableSelect" @longpress="onCableLongPress" />
      </div>

      <!-- Flightcase layout (body only, header in sticky) -->
      <div v-if="!ctMode && !microMode && (directMode || layout === 'flightcase')" class="table-scroll" ref="fcBodyScroll" @scroll="syncScroll('fcBodyScroll','fcHeaderScroll')" style="width:100%">
        <FcaseManagement :cables="filteredJoinedData" :active-cable-id="activeCableId" :direct-mode="directMode" :visible-fc="7" :subtract-mode="subtractMode" :increment-step="incrementStep" :solo-mode="fcSolo" :solo-filter="fcSoloFilter" @updated="onCableUpdated" @select="onCableSelect" @longpress="onCableLongPress" />
      </div>

      <!-- Boutons caisse sélectionnée -->
      <div class="print-all-bar" v-if="fcSolo && fcSoloFilter">
        <button class="action-btn" @click="openFcDetail(`tfc${fcSoloFilter}`, fcLabels[`lfc${fcSoloFilter}`] || `FC${fcSoloFilter}`)">
          🖨 {{ fcLabels[`lfc${fcSoloFilter}`] || `FC${fcSoloFilter}` }}
        </button>
        <button class="action-btn" @click="shareFcCaisse(fcSoloFilter)">
          📤 Partager
        </button>
      </div>

      <!-- Boutons caisse-type sélectionnée -->
      <div class="print-all-bar" v-if="ctSolo && ctSoloFilter">
        <button class="action-btn" @click="printCtCaisse(ctSoloFilter)">
          🖨 {{ settingsStore.defaultCtLabels[`ct${ctSoloFilter}`] || `CK${ctSoloFilter}` }}
        </button>
        <button class="action-btn" @click="shareCtCaisse(ctSoloFilter)">
          📤 Partager
        </button>
      </div>

      <div class="print-all-bar" v-if="!fcDetailVisible && !fcSoloFilter && !ctSoloFilter">
        <button class="action-btn" @click="printAllFc">🖨 Toutes les caisses</button>
        <button class="action-btn" @click="shareAllFc">📤 Partager</button>
      </div>

      <FcaseDetail
        :visible="fcDetailVisible"
        :fc-name="fcDetailName"
        :fc-field="fcDetailField"
        :cables="joinedData"
        :affair-name="selectedAffair?.name || ''"
        @close="fcDetailVisible = false"
      />
      <!-- Carte d'aide -->
      <div v-if="helpMode && helpTarget" class="help-card">
        <template v-if="helpTarget === 'search'">
          <h4>🔍 Rechercher</h4>
          <p>Tapez le nom d'un câble pour le retrouver rapidement dans la liste.</p>
        </template>
        <template v-else-if="helpTarget === 'add'">
          <h4>➕ Ajouter un câble</h4>
          <p>Créer un nouveau câble dans le catalogue. Choisissez d'abord le type (HP, Elec...) puis entrez le nom.</p>
        </template>
        <template v-else-if="helpTarget === 'micro'">
          <h4>🎤 Mode Micro</h4>
          <p>Répartir les micros par groupe de musiciens. Chaque groupe correspond à un plateau. La colonne Qté calcule automatiquement le maximum + les spares.</p>
        </template>
        <template v-else-if="helpTarget === 'ctype'">
          <h4>📦 Cablekit</h4>
          <p>Caisses pré-configurées par l'entreprise. Cliquez sur un titre de colonne pour voir son contenu. Appui long sur un titre pour le renommer.</p>
        </template>
        <template v-else-if="helpTarget === 'select'">
          <h4>✅ Sélectionner</h4>
          <p>Mode sélection : choisir les câbles nécessaires et les répartir par zone (Spare, Main, Front, Sub...).</p>
        </template>
        <template v-else-if="helpTarget === 'fc'">
          <h4>📋 Flightcase</h4>
          <p>Ranger les câbles sélectionnés dans des flightcases. Cliquez sur un titre FC pour voir son contenu. Appui long pour renommer.</p>
        </template>
        <template v-else-if="helpTarget === 'direct'">
          <h4>⚡ Direct dans Flight-case</h4>
          <p>Ranger directement les câbles dans les flight-cases sans passer par la sélection par zone.</p>
        </template>
        <template v-else-if="helpTarget === 'solo'">
          <h4>🔵 Solo (S)</h4>
          <p>Afficher uniquement les câbles qui ont été sélectionnés. Les autres apparaissent en dessous, estompés.</p>
        </template>
        <template v-else-if="helpTarget === 'subtract'">
          <h4>➖ Mode +/−</h4>
          <p>Basculer entre ajouter (+) et retirer (−). En mode −, chaque clic retire une unité.</p>
        </template>
        <template v-else-if="helpTarget === 'step10'">
          <h4>🔟 +10</h4>
          <p>Incrémenter de 10 au lieu de 1 à chaque clic. Utile pour les grandes quantités.</p>
        </template>
      </div>

      <div v-if="helpMode && !helpTarget" class="help-card">
        <h4>❓ Mode Aide</h4>
        <p>Cliquez sur n'importe quel bouton pour voir son explication. Cliquez sur <strong>?</strong> pour quitter l'aide.</p>
      </div>

      <!-- QR Code / Partage -->
      <div v-if="showQrCode" class="qr-overlay" @click="showQrCode = false">
        <div class="qr-panel" @click.stop>
          <div class="qr-header">
            <h4>📤 Partager</h4>
            <button class="qr-close" @click="showQrCode = false">✕</button>
          </div>
          <div v-if="qrDataUrl" class="qr-image">
            <img :src="qrDataUrl" alt="QR Code" width="220" height="220" />
          </div>
          <div v-else class="qr-loading">Génération du lien...</div>
          <div v-if="shareUrl" class="qr-link" @click="copyToClipboard">
            {{ shareUrl }}
          </div>
          <pre class="qr-text">{{ qrContent }}</pre>
          <div class="qr-actions">
            <button class="qr-btn" @click="copyToClipboard">📋 Copier le lien</button>
            <button class="qr-btn" @click="shareNative">📩 Email</button>
          </div>
        </div>
      </div>

      <!-- Fenêtre d'édition des étiquettes (appui long sur un en-tête) -->
      <div v-if="labelEditor.open" class="label-editor-overlay" @click.self="cancelLabelEditor">
        <div class="label-editor">
          <div class="le-title">{{ labelEditorTitle }}</div>
          <div class="le-rows">
            <label v-for="f in labelEditor.fields" :key="f.key" class="le-row">
              <span class="le-tag">{{ f.placeholder }}</span>
              <input v-model="f.value" :placeholder="f.placeholder" maxlength="10" @keydown.enter="saveLabelEditor" />
              <button v-if="labelEditor.type === 'zone'" type="button" class="le-stereo" :class="{ on: stereoOf(f) }" @click.prevent="toggleStereoField(f)" title="Stéréo (par côté)">par côté *</button>
            </label>
          </div>
          <div v-if="labelEditor.type === 'zone'" class="le-legend">* = par côté (stéréo)</div>
          <div class="le-actions">
            <button class="le-cancel" @click="cancelLabelEditor">Annuler</button>
            <button class="le-save" @click="saveLabelEditor">Valider</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Calculateur ampli → câblage (mode Select) -->
    <AmpWiring
      :open="ampWiringOpen"
      :zone-label="ampWiringZoneLabel"
      :zone-index="zoneSoloFilter"
      :stereo="ampWiringStereo"
      :cables="joinedData"
      @close="ampWiringOpen = false"
      @assign="onAmpAssign"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, inject } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useCableStore } from '../stores/cables'
import { supabase } from '../lib/supabase'
import { useAffairStore } from '../stores/affairs'
import { useOrderStore } from '../stores/orders'
import Affaires from '../components/Affaires.vue'
import AddAffair from '../components/AddAffair.vue'
import { openDocSmart } from '../lib/openDoc'
import QRCode from 'qrcode'
import CableList from '../components/CableList.vue'
import FcaseManagement from '../components/FcaseManagement.vue'
import FcaseDetail from '../components/FcaseDetail.vue'
import MicroList from '../components/MicroList.vue'
import CtypeList from '../components/CtypeList.vue'
import ButtonCableType from '../components/ButtonCableType.vue'
import AllCasesView from '../components/AllCasesView.vue'
import DocViewer from '../components/DocViewer.vue'
import AmpWiring from '../components/AmpWiring.vue'
import AmpCalculator from '../components/AmpCalculator.vue'
import { useSettingsStore } from '../stores/settings'
import { useMfcStore } from '../stores/mfc'

const helpMode = inject('helpMode', ref(false))
const helpTarget = ref(null)
const hasCompany = computed(() => {
  const catId = parseInt(localStorage.getItem('cablemaster-catalogid')) || 0
  return catId > 1
})
const hasCtContent = ref(false)

async function checkCtContent() {
  if (!hasCompany.value) { hasCtContent.value = false; return }
  const mfcs = mfcStore.mfcs
  if (!mfcs || mfcs.length === 0) { hasCtContent.value = false; return }
  for (const mfc of mfcs) {
    const { data } = await mfcStore.getMfcCables(mfc.mfcid)
    if (data?.length > 0) { hasCtContent.value = true; return }
  }
  hasCtContent.value = false
}
const userRole = inject('userRole', ref('technician'))
const companyNameInj = inject('companyName', ref(''))
// Nom de la liste en cours : « Liste de Moon/Tarpault » (entreprise) ou « Liste de Franck » (perso)
const listName = computed(() => {
  const a = selectedAffair.value
  if (a && a.catalog_id && a.catalog_id > 1) {
    return 'Liste de ' + (companyNameInj.value || "l'entreprise")
  }
  const userId = localStorage.getItem('cablemaster-userid') || ''
  let fn = ''
  try { fn = (JSON.parse(localStorage.getItem(`cablemaster-profile-${userId}`) || '{}').firstname) || '' } catch { /* ignore */ }
  return fn ? 'Liste de ' + fn : 'Ma liste'
})
const isMaster = computed(() => userRole.value === 'master')
const canEditCables = computed(() => {
  // Seuls les masters éditent la liste d'une entreprise.
  if (isMaster.value) return true
  // Un technicien rattaché à une entreprise (invité, lien reçu) ne modifie PAS sa liste :
  // il peut seulement déclarer ses besoins / signaler un câble manquant.
  const companyId = parseInt(localStorage.getItem('cablemaster-companyid')) || 0
  if (companyId) return false
  // Freelance sans entreprise → c'est sa liste perso, édition autorisée.
  return true
})

function onHelpClick(id, action) {
  if (helpMode.value) {
    helpTarget.value = helpTarget.value === id ? null : id
  } else {
    action()
  }
}

watch(helpMode, (val) => {
  if (!val) helpTarget.value = null
})

const cableStore = useCableStore()
const affairStore = useAffairStore()
const orderStore = useOrderStore()
const settingsStore = useSettingsStore()
const mfcStore = useMfcStore()

onMounted(async () => {
  await mfcStore.fetchMfcs()
  checkCtContent()
  // Recharger les câbles si une affaire est déjà sélectionnée (retour de navigation)
  if (selectedAffair.value && joinedData.value.length === 0) {
    await onAffairSelected(selectedAffair.value)
  }
  console.log('CableTech mounted, joinedData:', joinedData.value.length, 'types:', [...new Set(joinedData.value.map(c => c.type))])
})

const affairIsOpen = ref(false)
const editingAffair = ref(null)
const typeChoose = ref('speaker')
const searchKey = ref('')
const layout = ref('cableTechBase')
// Métier sur lequel on travaille (front / monitor / system / stage)
const activeRole = ref('front')

// Mémoriser les libellés (zones + FC) du métier donné dans l'objet affaire (local)
function saveLabelsToRole(role) {
  const a = selectedAffair.value
  if (!a) return
  const rl = { ...(a.role_labels || {}) }
  rl[role] = { ...zoneLabels, ...fcLabels }
  a.role_labels = rl
}

// Convertit le matériel décrit par le master (texte libre, une ligne par poste : « PA : 12 K2* »)
// en en-têtes de zones pour la grille du technicien. Garde l'astérisque (= stéréo / par côté).
function parseMaterielZones(text) {
  if (!text) return []
  return String(text).split(/\r?\n/)
    .map(l => l.trim())
    // on saute les commentaires et les lignes qui ne sont pas des positions à câbler
    .filter(l => l && !l.startsWith('(') && !/amplis?|rack|base micro|plan de sc[eè]ne/i.test(l))
    .map(l => {
      const ci = l.indexOf(':')
      let v = (ci >= 0 ? l.slice(ci + 1) : l).trim()           // « 12 K2* »
      if (!v || v === '…' || v === '...') v = (ci >= 0 ? l.slice(0, ci) : l).trim()
      return v.slice(0, 20)
    })
    .filter(v => v && v !== '…' && v !== '...')
    .slice(0, 6)
}

// Charger les libellés du métier actif :
// noms de zones renseignés par le master (role_labels) → sinon vide (le tech les nomme, placeholder Zone1…)
function loadLabelsForRole() {
  const a = selectedAffair.value
  if (!a) return
  const rl = (a.role_labels && a.role_labels[activeRole.value]) || {}
  // Zones : noms définis (master ou tech) → sinon Zone1… (le champ Amplis n'alimente plus les colonnes)
  for (let i = 1; i <= 6; i++) {
    zoneLabels[`lz${i}`] = rl[`lz${i}`] || ''
  }
  // Flight-cases : renommage métier → sinon noms de création de l'affaire → sinon FC1…
  for (let i = 1; i <= 7; i++) {
    fcLabels[`lfc${i}`] = rl[`lfc${i}`] || (a[`lfc${i}`] && a[`lfc${i}`].trim()) || ''
  }
}

// Cliquer un métier : enregistrer le métier courant, revenir en Select, charger le nouveau métier
async function onSelectRole(role) {
  allCasesMode.value = false
  microMode.value = false
  layout.value = 'cableTechBase'
  if (role === activeRole.value) return
  saveLabelsToRole(activeRole.value)
  if (autoSaveTimer) await autoSaveNow()
  activeRole.value = role
  loadLabelsForRole()
  rebuildJoinedData()
  activeCableId.value = null
}
const joinedData = ref([])
// Toutes les commandes de l'affaire, tous métiers confondus (pour reconstruire par métier)
const allOrders = ref([])
const directMode = ref(false)
const saving = ref(false)
const activeCableId = ref(null)
const zoneHeaderScroll = ref(null)
const zoneBodyScroll = ref(null)
const fcHeaderScroll = ref(null)
const fcBodyScroll = ref(null)
const ctHeaderScroll = ref(null)
const ctBodyScroll = ref(null)

const scrollRefs = { zoneHeaderScroll, zoneBodyScroll, fcHeaderScroll, fcBodyScroll, ctHeaderScroll, ctBodyScroll }
let isSyncing = false
function syncScroll(source, target) {
  if (isSyncing) return
  isSyncing = true
  const srcEl = scrollRefs[source]?.value
  const tgtEl = scrollRefs[target]?.value
  if (srcEl && tgtEl) {
    tgtEl.scrollLeft = srcEl.scrollLeft
  }
  requestAnimationFrame(() => { isSyncing = false })
}
const subtractMode = ref(false)
const microMode = ref(false)
const microSolo = ref(false)
// Vue Micro : liste (saisie des besoins) ↔ photos (galerie des micros de la liste)
const microGalleryView = ref(false)
const micGalleryItems = computed(() => (filteredJoinedData.value || []).filter(c => c.type === 'microphone'))
function openMicPhoto(m) { if (m?.image_url) openDocSmart(m.image_url) }
// Appui long sur un micro → pop-up photo (+ bouton PDF), au lieu d'ouvrir l'édition
const micPopup = reactive({ open: false, mic: null })
function onMicLongPress(cable) { micPopup.mic = cable; micPopup.open = true }
const soloMode = ref(false)
const incrementStep = ref(1)
const ctMode = ref(false)
const allCasesMode = ref(false)

// Vue d'ensemble par poste (Front → Monitor → System → Stage) : par défaut au clic technicien
const overviewMode = ref(false)

function toggleAllCases() {
  allCasesMode.value = !allCasesMode.value
  if (allCasesMode.value) {
    microMode.value = false
    ctMode.value = false
    directMode.value = false
    overviewMode.value = false
  }
}

// Équipe de l'affaire (postes + assistants) — affichée au technicien
function personNameC(fn, nm) {
  fn = (fn || '').trim(); nm = (nm || '').trim()
  if (!fn) return nm || '?'
  if (!nm) return fn
  return nm.toLowerCase().startsWith(fn.toLowerCase()) ? nm : fn + ' ' + nm
}
const affairTeam = computed(() => {
  const a = selectedAffair.value
  if (!a) return []
  const t = []
  if (a.front) t.push({ role: 'FOH', name: personNameC(a.tech_firstname, a.tech_name) })
  if (a.monitor) t.push({ role: 'Monitor', name: personNameC(a.tech_firstname_monitor, a.tech_name_monitor) })
  if (a.system) t.push({ role: 'Système', name: personNameC(a.tech_firstname_system, a.tech_name_system) })
  if (a.stage) t.push({ role: 'Stage', name: personNameC(a.tech_firstname_stage, a.tech_name_stage) })
  ;(Array.isArray(a.assistants) ? a.assistants : []).forEach(as => {
    if (as.email || as.name || as.firstname) t.push({ role: 'Assistant', name: personNameC(as.firstname, as.name) })
  })
  return t
})

// Le technicien valide son câblage → message « câblage validé » à l'entreprise (master)
async function validateCabling() {
  const a = selectedAffair.value
  if (!a) return
  if (!confirm('Confirmer : ton câblage est prêt ?\nUn message « câblage validé » sera envoyé à l\'entreprise.')) return
  const email = (localStorage.getItem('cablemaster-email') || '').trim() || null
  try {
    await supabase.from('message').insert({
      affairid: a.affairid, sender_role: 'tech',
      text: '✅ Câblage validé — ma caisse est prête.',
      peer_email: email, read_by_tech: true, read_by_master: false,
    })
    alert('Câblage validé — message envoyé à l\'entreprise. ✅')
  } catch (e) { alert('Erreur lors de la validation.') }
}

// Quitter la vue d'ensemble pour éditer la distribution
function editDistribution(role) {
  overviewMode.value = false
  if (role && role !== 'micro') {
    onSelectRole(role)
  } else if (role === 'micro') {
    microMode.value = true
  }
}

// Besoins déclarés par poste (câbles avec quantité > 0), empilés du Front au Stage
const needsByRole = computed(() => {
  const need = o => (o.spare_count||0)+(o.z1||0)+(o.z2||0)+(o.z3||0)+(o.z4||0)+(o.z5||0)+(o.z6||0)
  const a = selectedAffair.value
  const groups = ROLE_DEFS.map(def => {
    const map = {}
    for (const o of allOrders.value) if ((o.role || 'front') === def.role) map[o.cableid] = o
    const items = []
    for (const cable of cableStore.cables) {
      const o = map[cable.cableid]
      if (!o) continue
      const n = need(o)
      if (n <= 0) continue
      items.push({ cableid: cable.cableid, name: cable.name, need: n })
    }
    // Description de zone saisie par le master (materiel_front/monitor/system/stage)
    const desc = (a && a[`materiel_${def.role}`]) ? a[`materiel_${def.role}`] : ''
    return { ...def, items, desc }
  }).filter(g => g.items.length > 0 || g.desc)

  // Micros (caisse commune)
  const mitems = []
  for (const cable of cableStore.cables) {
    if (cable.type !== 'microphone') continue
    const o = allOrders.value.find(x => x.cableid === cable.cableid && (x.role || 'front') === 'micro')
    if (!o) continue
    const n = need(o)
    if (n <= 0) continue
    mitems.push({ cableid: cable.cableid, name: cable.name, need: n })
  }
  if (mitems.length) groups.push({ role: 'micro', label: '🎤 Micros', color: '#eb910a', items: mitems })
  return groups
})

function getZoneCables() {
  return joinedData.value.filter(c => {
    return (c.spare_count || 0) + (c.z1 || 0) + (c.z2 || 0) + (c.z3 || 0) + (c.z4 || 0) + (c.z5 || 0) + (c.z6 || 0) > 0
  })
}

function getZoneTotalForCase(cable) {
  return (cable.spare_count || 0) + (cable.z1 || 0) + (cable.z2 || 0) + (cable.z3 || 0) + (cable.z4 || 0) + (cable.z5 || 0) + (cable.z6 || 0)
}

function getFcCables(fcIndex) {
  return joinedData.value.filter(c => (c[`tfc${fcIndex}`] || 0) > 0)
}

function getMicroCables() {
  return joinedData.value.filter(c => c.type === 'microphone' && (
    (c.spare_count || 0) + (c.tfc1 || 0) + (c.tfc2 || 0) + (c.tfc3 || 0) + (c.tfc4 || 0) + (c.tfc5 || 0) > 0
  ))
}

function getMicroQty(cable) {
  const max = Math.max(cable.tfc1 || 0, cable.tfc2 || 0, cable.tfc3 || 0, cable.tfc4 || 0, cable.tfc5 || 0)
  return max + (cable.spare_count || 0)
}

function printAllCasesSummary() {
  let html = `<html><head><title>Caisses - ${selectedAffair.value?.name || ''}</title><style>
    body { font-family: sans-serif; padding: 20px; }
    h1 { font-size: 20px; }
    .section { margin-bottom: 15px; page-break-inside: avoid; }
    .section-title { font-size: 16px; font-weight: bold; padding: 6px; border-bottom: 2px solid #333; }
    .cable { display: flex; justify-content: space-between; padding: 3px 10px; border-bottom: 1px solid #eee; font-size: 13px; }
  </style></head><body>`
  html += `<h1>${selectedAffair.value?.name || 'Caisses'}</h1>`

  for (let i = 1; i <= 7; i++) {
    const cables = getFcCables(i)
    if (cables.length === 0) continue
    const label = fcLabels[`lfc${i}`] || `FC${i}`
    html += `<div class="section"><div class="section-title">${label}</div>`
    for (const c of cables) html += `<div class="cable"><span>${c.name}</span><span>x${c[`tfc${i}`]}</span></div>`
    html += `</div>`
  }

  const mics = getMicroCables()
  if (mics.length > 0) {
    html += `<div class="section"><div class="section-title">🎤 Micros</div>`
    for (const c of mics) html += `<div class="cable"><span>${c.name}</span><span>x${getMicroQty(c)}</span></div>`
    html += `</div>`
  }

  html += `</body></html>`
  const w = window.open('', '_blank', 'width=500,height=700')
  w.document.write(html)
  w.document.close()
  w.print()
}

async function shareAllCasesSummary() {
  let text = `Caisses - ${selectedAffair.value?.name || ''}\n\n`
  for (let i = 1; i <= 7; i++) {
    const cables = getFcCables(i)
    if (cables.length === 0) continue
    text += `${fcLabels[`lfc${i}`] || `FC${i}`}\n`
    for (const c of cables) text += `  ${c.name} x${c[`tfc${i}`]}\n`
    text += '\n'
  }
  const mics = getMicroCables()
  if (mics.length > 0) {
    text += `🎤 Micros\n`
    for (const c of mics) text += `  ${c.name} x${getMicroQty(c)}\n`
  }
  qrContent.value = text
  shareUrl.value = ''
  showQrCode.value = true
  await generateShareLink()
}
const ctSolo = ref(false)
const ctSoloFilter = ref(null)  // null = tous, 1-7 = CT spécifique
const fcSoloFilter = ref(null)  // null = tous, 1-7 = FC spécifique
const zoneSoloFilter = ref(null)  // null = toutes, 1-6 = zone spécifique

const fcSolo = ref(false)

// Faire un solo (sélectionner une colonne) vide le champ de recherche
watch([zoneSoloFilter, fcSoloFilter, ctSoloFilter], ([z, f, c]) => {
  if (z || f || c) searchKey.value = ''
})

// Calculateur ampli → câblage
const ampWiringOpen = ref(false)
const ampWiringZoneLabel = computed(() => {
  const z = zoneSoloFilter.value
  return z ? zoneBase(zoneLabels[`lz${z}`] || '') : ''
})
const ampWiringStereo = computed(() => {
  const z = zoneSoloFilter.value
  return z ? zoneStereo(zoneLabels[`lz${z}`] || '') : false
})
// Assigner le câblage proposé dans la colonne de zone (défaut zone 1 si aucune soloée)
function onAmpAssign({ zone, items }) {
  const z = (zone === 0 || zone) ? zone : 1
  const field = z === 0 ? 'spare_count' : `z${z}`
  // Repartir d'une base vierge : on vide toute la colonne de la zone avant d'assigner
  for (const c of joinedData.value) c[field] = 0
  for (const it of items) {
    const c = joinedData.value.find(x => x.cableid === it.cableid)
    if (c) c[field] = it.qty
  }
  scheduleAutoSave()
  ampWiringOpen.value = false
}

// Spare soloable : clic sur l'en-tête Spare → solo sur la colonne Spare (0) ; re-clic = éteint
function onSpareSolo() {
  if (soloMode.value && zoneSoloFilter.value === 0) { soloMode.value = false; zoneSoloFilter.value = null }
  else { soloMode.value = true; zoneSoloFilter.value = 0; typeChoose.value = '' }
}

function onCtHeaderClick(i) {
  // Clic → solo sur ce cablekit ; re-clic sur le même = éteint
  if (ctSolo.value && ctSoloFilter.value === i) { ctSolo.value = false; ctSoloFilter.value = null }
  else { ctSolo.value = true; ctSoloFilter.value = i; typeChoose.value = '' }
}

function onFcHeaderClick(i) {
  if (fcSoloFilter.value === i) {
    fcSolo.value = false
    fcSoloFilter.value = null
    typeChoose.value = 'speaker'
  } else {
    fcSolo.value = true
    fcSoloFilter.value = i
    typeChoose.value = ''
  }
}

function onZoneHeaderClick(i) {
  if (zoneSoloFilter.value === i) {
    soloMode.value = false
    zoneSoloFilter.value = null
  } else {
    soloMode.value = true
    zoneSoloFilter.value = i
  }
}

// En-têtes de colonnes (zones & flight-cases) :
//   clic court = ouvrir le détail (voir le contenu) ; appui long = renommer en ligne

let headerPressTimer = null
let headerMoved = false
let headerLongFired = false

function startHeaderPress(type, index) {
  headerMoved = false
  headerLongFired = false
  clearTimeout(headerPressTimer)
  // Appui long → la fenêtre s'ouvre PENDANT l'appui (pouce encore posé) ;
  // on relâche une fois qu'elle est ouverte.
  headerPressTimer = setTimeout(() => {
    if (headerMoved) return
    headerLongFired = true
    openLabelEditor(type)
  }, 500)
}

function onHeaderMove() {
  // L'utilisateur fait défiler : on annule l'appui
  headerMoved = true
  clearTimeout(headerPressTimer)
}

function endHeaderPress(type, index) {
  clearTimeout(headerPressTimer)
  if (headerMoved || headerLongFired) return
  // Tap court sur un en-tête → passe direct en solo sur cette colonne ; re-clic = éteint
  if (type === 'ct') { onCtHeaderClick(index); return }
  if (type === 'fc') {
    if (fcSolo.value && fcSoloFilter.value === index) { fcSolo.value = false; fcSoloFilter.value = null }
    else { fcSolo.value = true; fcSoloFilter.value = index; typeChoose.value = '' }
    return
  }
  if (type === 'zone') {
    if (soloMode.value && zoneSoloFilter.value === index) { soloMode.value = false; zoneSoloFilter.value = null }
    else { soloMode.value = true; zoneSoloFilter.value = index; typeChoose.value = '' }
  }
}

function cancelHeaderPress() {
  headerMoved = true
  clearTimeout(headerPressTimer)
}

// --- Fenêtre d'édition des étiquettes (tous les champs d'un coup) ---
const labelEditor = reactive({ open: false, type: '', fields: [] })
const labelEditorTitle = computed(() =>
  labelEditor.type === 'zone' ? 'Renommer les zones de diffusion'
    : labelEditor.type === 'fc' ? 'Renommer les flight-cases'
      : 'Renommer les cablekits'
)
function openLabelEditor(type) {
  labelEditor.type = type
  if (type === 'zone') {
    labelEditor.fields = Array.from({ length: 6 }, (_, k) => ({ key: `lz${k + 1}`, placeholder: `Zone${k + 1}`, value: zoneLabels[`lz${k + 1}`] || '' }))
  } else if (type === 'fc') {
    labelEditor.fields = Array.from({ length: 7 }, (_, k) => ({ key: `lfc${k + 1}`, placeholder: `FC${k + 1}`, value: fcLabels[`lfc${k + 1}`] || '' }))
  } else if (type === 'ct') {
    labelEditor.fields = Array.from({ length: 7 }, (_, k) => ({ key: `ct${k + 1}`, placeholder: `CK${k + 1}`, value: settingsStore.defaultCtLabels[`ct${k + 1}`] || '' }))
  }
  labelEditor.open = true
}
function saveLabelEditor() {
  for (const f of labelEditor.fields) {
    const v = (f.value || '').trim()
    if (labelEditor.type === 'zone') zoneLabels[f.key] = v
    else if (labelEditor.type === 'fc') fcLabels[f.key] = v
    else if (labelEditor.type === 'ct') settingsStore.defaultCtLabels[f.key] = v
  }
  labelEditor.open = false
}
function cancelLabelEditor() { labelEditor.open = false }

// Stéréo « par côté » : marqué par un astérisque en fin de titre de zone
function stereoOf(f) { return /\*\s*$/.test(f.value || '') }
function toggleStereoField(f) {
  const base = (f.value || '').replace(/\s*\*\s*$/, '')
  f.value = stereoOf(f) ? base : base + '*'
}
// Affichage en-tête : titre sans l'astérisque + détection du flag stéréo
function zoneBase(lbl) { return (lbl || '').replace(/\s*\*\s*$/, '') }
function zoneStereo(lbl) { return /\*\s*$/.test(lbl || '') }

const ctEditMode = ref(false)
let ctBtnTimer = null
let ctBtnDidLong = false

function startCtBtnPress() {
  ctBtnDidLong = false
  ctBtnTimer = setTimeout(() => {
    ctBtnDidLong = true
    // Long clic : éditer (seulement Cable Master)
    if (isMaster.value) {
      if (!ctMode.value) {
        ctMode.value = true
        microMode.value = false
        directMode.value = false
        typeChoose.value = 'speaker'
        loadAllCtCables()
      }
      ctEditMode.value = true
    }
  }, 800)
}

function endCtBtnPress() {
  clearTimeout(ctBtnTimer)
  if (!ctBtnDidLong) {
    // Clic court : voir / toggle
    if (ctMode.value && ctEditMode.value) {
      // Sortir du mode édition, rester en lecture
      ctEditMode.value = false
    } else {
      toggleCtMode()
      ctEditMode.value = false
    }
  }
}

function cancelCtBtnPress() {
  clearTimeout(ctBtnTimer)
}

function toggleCtMode() {
  ctMode.value = !ctMode.value
  if (ctMode.value) {
    microMode.value = false
    directMode.value = false
    typeChoose.value = ''
    ctSolo.value = true
    ctSoloFilter.value = 1
    loadAllCtCables()
  } else {
    typeChoose.value = 'speaker'
    ctSolo.value = false
    ctSoloFilter.value = null
  }
}

// { cableid: { 1: count, 2: count, ... } }
const ctAllCounts = ref({})

const ctFilteredCables = computed(() => {
  let list = cableStore.cables
  if (typeChoose.value) {
    list = list.filter(c => c.type === typeChoose.value)
  }
  if (searchKey.value) {
    const q = searchKey.value.toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(q))
  }
  return list
})
const ctMfcIds = ref({}) // { 1: mfcid, 2: mfcid, ... }

async function loadAllCtCables() {
  const counts = {}
  const ids = {}
  for (let i = 1; i <= 7; i++) {
    const ctName = settingsStore.defaultCtLabels[`ct${i}`] || `CK${i}`
    const mfc = mfcStore.mfcs.find(m => m.name === ctName || m.name === `CK${i}`)
    if (!mfc) continue
    ids[i] = mfc.mfcid
    const { data } = await mfcStore.getMfcCables(mfc.mfcid)
    if (data) {
      for (const item of data) {
        if (!counts[item.cableid]) counts[item.cableid] = {}
        counts[item.cableid][i] = item.count
      }
    }
  }
  ctAllCounts.value = counts
  ctMfcIds.value = ids
}

async function onCtCableUpdated({ cableid, ctIndex, count }) {
  // Mettre à jour localement
  if (!ctAllCounts.value[cableid]) ctAllCounts.value[cableid] = {}
  ctAllCounts.value[cableid][ctIndex] = count
  ctAllCounts.value = { ...ctAllCounts.value }

  // Sauvegarder dans Supabase
  let mfcid = ctMfcIds.value[ctIndex]
  if (!mfcid) {
    const ctName = settingsStore.defaultCtLabels[`ct${ctIndex}`] || `CK${ctIndex}`
    const { data } = await mfcStore.addMfc({ name: ctName, info: '' })
    if (data?.[0]) {
      mfcid = data[0].mfcid
      ctMfcIds.value[ctIndex] = mfcid
    } else return
  }
  await mfcStore.setCableMfc(mfcid, cableid, count)
}

function toggleMicroMode() {
  microMode.value = !microMode.value
  if (microMode.value) {
    ctMode.value = false
    typeChoose.value = 'microphone'
    directMode.value = true
  } else {
    typeChoose.value = 'speaker'
    directMode.value = false
  }
}
const showAddInput = ref(false)
const newCableName = ref('')
const addInput = ref(null)
const editingCable = ref(null)
const editForm = reactive({ name: '', type: '', weight: 0, brand: '' })

const typeKeys = ['speaker', 'electrical', 'module', 'special', 'other', 'accessory', 'digital', 'type8', 'type9', 'type10']
const defaultLabels = ['HP', 'Elec', 'Modules', 'Spéciaux', 'Autres', 'Accessoires', 'Numériques', '', '', '']

const cableTypes = computed(() => {
  const all = typeKeys.map((value, i) => ({
    value,
    label: settingsStore.defaultTypeLabels[`type${i + 1}`] || defaultLabels[i]
  })).filter(t => t.label)
  // Ajouter micro et caisse-type (toujours présents)
  all.push({ value: 'microphone', label: 'Micros' })
  all.push({ value: 'c_type', label: 'Cablekit' })
  return all
})

function typeLabel(type) {
  const found = cableTypes.value.find(t => t.value === type)
  return found ? found.label : type
}

// Ajouter un micro manquant → catégorie « supplementaire » (apparaît en haut de la liste micro)
const newMicName = ref('')
async function quickAddMic() {
  const name = newMicName.value.trim()
  if (!name) return
  const catalogId = selectedAffair.value?.catalog_id || parseInt(localStorage.getItem('cablemaster-catalogid')) || null
  const { error } = await cableStore.addCable({ name, type: 'microphone', mic_category: 'supplementaire', weight: 0, total: 0, reserved: 0, catalog_id: catalogId })
  if (!error) {
    newMicName.value = ''
    showAddInput.value = false
    await cableStore.fetchCables(catalogId)
    if (selectedAffair.value) {
      const { data: orders } = await orderStore.fetchOrders({ affairid: selectedAffair.value.affairid })
      buildJoinedData(orders || [], cableStore.cables)
    }
  }
}

async function quickAddCable() {
  const name = newCableName.value.trim()
  if (!name) return
  const type = typeChoose.value || 'other'
  const catalogId = selectedAffair.value?.catalog_id || null
  const { error } = await cableStore.addCable({ name, type, weight: 0, total: 0, reserved: 0, catalog_id: catalogId })
  if (!error) {
    newCableName.value = ''
    // Recharger les câbles du bon catalogue et reconstruire
    await cableStore.fetchCables(catalogId)
    if (selectedAffair.value) {
      const { data: orders } = await orderStore.fetchOrders({ affairid: selectedAffair.value.affairid })
      buildJoinedData(orders || [], cableStore.cables)
    }
  }
}

// Demande de câble manquant : envoyée au master via le fil de messages de l'affaire
const requestText = ref('')
const requestSent = ref(false)
async function sendCableRequest() {
  const txt = requestText.value.trim()
  const a = selectedAffair.value
  if (!txt || !a) return
  await supabase.from('message').insert({
    affairid: a.affairid,
    sender_role: 'tech',
    text: `🔌 Besoin câble : ${txt}`,
    read_by_tech: true,
    read_by_master: false,
  })
  requestText.value = ''
  requestSent.value = true
  setTimeout(() => { requestSent.value = false; showAddInput.value = false }, 1500)
}

function onCableLongPress(cable) {
  // Micro avec fiche PDF (cable.link) → appui long ouvre le PDF
  if (cable.type === 'microphone' && cable.link) { openDocSmart(cable.link); return }
  editingCable.value = cable
  editForm.name = cable.name
  editForm.type = cable.type
  editForm.weight = cable.weight || 0
  editForm.brand = cable.brand || ''
}

async function saveEditCable() {
  if (!editingCable.value) return
  await cableStore.updateCable(editingCable.value.cableid, {
    name: editForm.name,
    type: editForm.type,
    weight: editForm.weight,
    brand: editForm.brand,
  })
  // Mettre à jour le joinedData local
  const item = joinedData.value.find(c => c.cableid === editingCable.value.cableid)
  if (item) {
    item.name = editForm.name
    item.type = editForm.type
    item.weight = editForm.weight
  }
  editingCable.value = null
}

async function deleteEditCable() {
  if (!editingCable.value) return
  if (!confirm(`Supprimer "${editingCable.value.name}" ?`)) return
  await cableStore.deleteCable(editingCable.value.cableid)
  joinedData.value = joinedData.value.filter(c => c.cableid !== editingCable.value.cableid)
  editingCable.value = null
}

const zoneLabels = reactive({ lz1: '', lz2: '', lz3: '', lz4: '', lz5: '', lz6: '' })
const fcLabels = reactive({ lfc1: '', lfc2: '', lfc3: '', lfc4: '', lfc5: '', lfc6: '', lfc7: '' })
const microGroupLabels = reactive({ mg1: '', mg2: '', mg3: '', mg4: '', mg5: '' })

const fcDetailVisible = ref(false)
const fcDetailField = ref('')
const fcDetailName = ref('')

function openFcDetail(field, name) {
  fcDetailField.value = field
  fcDetailName.value = name
  fcDetailVisible.value = true
}

const fcFields = ['tfc1', 'tfc2', 'tfc3', 'tfc4', 'tfc5', 'tfc6', 'tfc7']

function getFcLabel(index) {
  const key = `lfc${index + 1}`
  return fcLabels[key] || `FC${index + 1}`
}

function printAllFc() {
  const typeOrder = ['speaker', 'electrical', 'module', 'microphone', 'digital', 'special', 'other', 'c_type', 'accessory']
  const typeLabels = {
    speaker: 'HP', electrical: 'Électrique', module: 'Modules',
    microphone: 'Micros', special: 'Spéciaux', other: 'Autres',
    c_type: 'Cablekit', accessory: 'Accessoires', digital: 'Digital'
  }

  let html = `<html><head><title>Caisses - ${selectedAffair.value?.name || ''}</title><style>
    body { font-family: sans-serif; padding: 15px; }
    h1 { font-size: 18px; margin: 0 0 15px; }
    .fc { page-break-inside: avoid; margin-bottom: 20px; border: 1px solid #ccc; border-radius: 6px; padding: 10px; }
    .fc-title { font-size: 16px; font-weight: bold; margin: 0 0 8px; padding-bottom: 4px; border-bottom: 2px solid var(--color1); }
    .group { margin-bottom: 6px; }
    .group-title { font-weight: bold; font-size: 13px; padding: 3px 8px; background: #f0f0f0; border-left: 4px solid #ccc; display: flex; justify-content: space-between; }
    .row { display: flex; justify-content: space-between; padding: 2px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
    .fc-total { font-weight: bold; text-align: right; margin-top: 6px; font-size: 13px; }
  </style></head><body>`

  html += `<h1>${selectedAffair.value?.name || 'Caisses'}</h1>`

  for (let i = 0; i < fcFields.length; i++) {
    const field = fcFields[i]
    const label = getFcLabel(i)
    const cablesInFc = joinedData.value
      .filter(c => (c[field] || 0) > 0)
      .map(c => ({ name: c.name, type: c.type, qty: c[field] }))

    if (cablesInFc.length === 0) continue

    const groups = {}
    for (const c of cablesInFc) {
      if (!groups[c.type]) groups[c.type] = { cables: [], total: 0 }
      groups[c.type].cables.push(c)
      groups[c.type].total += c.qty
    }

    const fcTotal = cablesInFc.reduce((s, c) => s + c.qty, 0)

    html += `<div class="fc"><div class="fc-title">${label}</div>`
    for (const type of typeOrder) {
      if (!groups[type]) continue
      html += `<div class="group"><div class="group-title" style="border-left-color:${colorForType(type)}"><span>${typeLabels[type] || type}</span><span>${groups[type].total}</span></div>`
      for (const cable of groups[type].cables) {
        html += `<div class="row"><span>${cable.name}</span><span>${cable.qty}</span></div>`
      }
      html += `</div>`
    }
    html += `<div class="fc-total">Total: ${fcTotal} câbles</div></div>`
  }

  html += `</body></html>`
  const w = window.open('', '_blank', 'width=500,height=700')
  w.document.write(html)
  w.document.close()
  w.print()
}

function printCtCaisse(ctIndex) {
  const ctName = settingsStore.defaultCtLabels[`ct${ctIndex}`] || `CK${ctIndex}`
  const counts = ctAllCounts.value
  const cables = cableStore.cables
    .filter(c => (counts[c.cableid]?.[ctIndex] || 0) > 0)
    .map(c => ({ name: c.name, type: c.type, qty: counts[c.cableid][ctIndex] }))

  if (cables.length === 0) return

  const typeOrder = ['speaker', 'electrical', 'module', 'microphone', 'digital', 'special', 'other', 'c_type', 'accessory']
  const typeLabels = {
    speaker: 'HP', electrical: 'Électrique', module: 'Modules',
    microphone: 'Micros', special: 'Spéciaux', other: 'Autres',
    c_type: 'Cablekit', accessory: 'Accessoires', digital: 'Digital'
  }

  const groups = {}
  for (const c of cables) {
    if (!groups[c.type]) groups[c.type] = { cables: [], total: 0 }
    groups[c.type].cables.push(c)
    groups[c.type].total += c.qty
  }
  const total = cables.reduce((s, c) => s + c.qty, 0)

  let html = `<html><head><title>${ctName}</title><style>
    body { font-family: sans-serif; padding: 15px; }
    h1 { font-size: 18px; margin: 0 0 15px; }
    .group-title { font-weight: bold; font-size: 13px; padding: 3px 8px; background: #f0f0f0; border-left: 4px solid #ccc; display: flex; justify-content: space-between; }
    .row { display: flex; justify-content: space-between; padding: 2px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
    .total { font-weight: bold; text-align: right; margin-top: 10px; font-size: 14px; }
  </style></head><body>`
  html += `<h1>${ctName}</h1>`

  for (const type of typeOrder) {
    if (!groups[type]) continue
    html += `<div class="group-title" style="border-left-color:${colorForType(type)}"><span>${typeLabels[type] || type}</span><span>${groups[type].total}</span></div>`
    for (const cable of groups[type].cables) {
      html += `<div class="row"><span>${cable.name}</span><span>${cable.qty}</span></div>`
    }
  }
  html += `<div class="total">Total: ${total} câbles</div>`
  html += `</body></html>`

  const w = window.open('', '_blank', 'width=500,height=700')
  w.document.write(html)
  w.document.close()
  w.print()
}

function buildFcText(fcIndex) {
  const field = `tfc${fcIndex}`
  const label = fcLabels[`lfc${fcIndex}`] || `FC${fcIndex}`
  const cables = joinedData.value
    .filter(c => (c[field] || 0) > 0)
    .map(c => `  ${c.name} x${c[field]}`)
  if (cables.length === 0) return ''
  return `${label}\n${cables.join('\n')}`
}

function buildAllFcText() {
  const affairName = selectedAffair.value?.name || ''
  let text = `Câblage - ${affairName}\n\n`
  for (let i = 1; i <= 7; i++) {
    const section = buildFcText(i)
    if (section) text += section + '\n\n'
  }
  return text.trim()
}

async function shareFcCaisse(fcIndex) {
  const text = buildFcText(fcIndex)
  if (!text) return
  qrContent.value = text
  shareUrl.value = ''
  showQrCode.value = true
  await generateShareLink()
}

const showQrCode = ref(false)
const qrContent = ref('')

async function shareAllFc() {
  const text = buildAllFcText()
  if (!text) return
  qrContent.value = text
  shareUrl.value = ''
  showQrCode.value = true
  await generateShareLink()
}

async function shareCtCaisse(ctIndex) {
  const ctName = settingsStore.defaultCtLabels[`ct${ctIndex}`] || `CK${ctIndex}`
  const counts = ctAllCounts.value
  const cables = cableStore.cables
    .filter(c => (counts[c.cableid]?.[ctIndex] || 0) > 0)
    .map(c => `  ${c.name} x${counts[c.cableid][ctIndex]}`)
  if (cables.length === 0) return
  qrContent.value = `${ctName}\n${cables.join('\n')}`
  shareUrl.value = ''
  showQrCode.value = true
  await generateShareLink()
}

const shareUrl = ref('')
const qrDataUrl = ref('')

async function generateShareLink() {
  const affairName = selectedAffair.value?.name || 'Câblage'
  const token = Date.now().toString(36) + Math.random().toString(36).substr(2, 6)

  // Stocker dans Supabase
  const { error } = await supabase
    .from('share')
    .insert({
      token,
      affair_name: affairName,
      content: qrContent.value,
      created_at: new Date().toISOString(),
    })

  if (!error) {
    shareUrl.value = `${window.location.origin}/share/${token}`
  } else {
    console.warn('Partage : échec enregistrement', error.message)
    shareUrl.value = ''
  }
  // QR généré LOCALEMENT (plus de dépendance à un service externe qui peut être bloqué/hors-ligne)
  if (shareUrl.value) {
    try { qrDataUrl.value = await QRCode.toDataURL(shareUrl.value, { width: 220, margin: 1 }) }
    catch (e) { qrDataUrl.value = '' }
  } else {
    qrDataUrl.value = ''
  }
}

async function copyToClipboard() {
  const textToCopy = shareUrl.value || qrContent.value
  try {
    await navigator.clipboard.writeText(textToCopy)
    alert('Lien copié !')
  } catch {
    const ta = document.createElement('textarea')
    ta.value = textToCopy
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    alert('Lien copié !')
  }
}

function shareNative() {
  const affair = selectedAffair.value
  const affairName = affair?.name || 'Câblage'
  const link = shareUrl.value || ''
  const techNote = affair?.tech_note || ''
  const subject = encodeURIComponent(`Câblage - ${affairName}`)
  const body = encodeURIComponent(
`Bonjour,

Voici le câblage pour "${affairName}" :

${link}

${qrContent.value}
${techNote ? '\n--- Note du technicien ---\n' + techNote + '\n' : ''}
Cordialement`)
  window.location.href = `mailto:?subject=${subject}&body=${body}`
  showQrCode.value = false
}

function onCableSelect(cableid) {
  activeCableId.value = activeCableId.value == cableid ? null : cableid
}

// Toggle mode direct
function toggleDirectMode() {
  directMode.value = !directMode.value
  if (directMode.value) {
    layout.value = 'flightcase'
  }
}

// --- Auto-sauvegarde ---
let autoSaveTimer = null

function scheduleAutoSave() {
  clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    autoSaveNow()
  }, 1500)
}

async function autoSaveNow() {
  if (!selectedAffair.value) return
  clearTimeout(autoSaveTimer)
  saving.value = true

  // Sauvegarder labels : zones+FC par métier (role_labels), micros communs (mg)
  saveLabelsToRole(activeRole.value)
  const labelUpdate = { role_labels: selectedAffair.value.role_labels || {}, ...microGroupLabels }
  const { error: labelError } = await affairStore.updateAffair(selectedAffair.value.affairid, labelUpdate)
  if (labelError) console.error('Erreur save labels:', labelError.message)

  // Sauvegarder orders
  const hasMicData = (c) => c.type === 'microphone' && ((c.need || 0) > 0 || (c.proposed || 0) > 0 || (c.sublease || 0) > 0 || (c.detail && c.detail.trim()))
  const toSave = joinedData.value
    .filter(c => getZoneTotal(c) > 0 || getTfcTotal(c) > 0 || hasMicData(c))
    .map(c => ({
      cableid: c.cableid,
      affairid: c.affairid,
      tech_id: c.tech_id,
      role: c.role || 'front',
      done: c.done,
      count: getZoneTotal(c) > 0 ? getZoneTotal(c) : getTfcTotal(c),
      need: c.need || 0,
      proposed: c.proposed || 0,
      sublease: c.sublease || 0,
      detail: c.detail || null,
      spare_count: c.spare_count,
      z1: c.z1, z2: c.z2, z3: c.z3, z4: c.z4, z5: c.z5, z6: c.z6,
      tfc1: c.tfc1, tfc2: c.tfc2, tfc3: c.tfc3, tfc4: c.tfc4, tfc5: c.tfc5, tfc6: c.tfc6, tfc7: c.tfc7,
      tfc_done: c.tfc_done,
    }))

  if (toSave.length) {
    const { error } = await orderStore.setOrders(toSave)
    if (error) {
      console.error('Erreur sauvegarde:', error)
    } else {
      // Tenir allOrders à jour pour que le changement de métier reflète les dernières saisies
      for (const o of toSave) {
        const i = allOrders.value.findIndex(x => x.cableid === o.cableid && (x.role || 'front') === o.role)
        if (i >= 0) allOrders.value[i] = { ...allOrders.value[i], ...o }
        else allOrders.value.push({ ...o })
      }
    }
  }

  saving.value = false
}

// Auto-save labels quand ils changent
watch([zoneLabels, fcLabels, microGroupLabels], () => {
  if (!selectedAffair.value) return
  scheduleAutoSave()
}, { deep: true })


function onCableUpdated() {
  scheduleAutoSave()
}

const selectedAffair = computed(() => affairStore.selectedAffair)

// Valider / déverrouiller la caisse micro (master)
async function setMicrosValidated(v) {
  if (!selectedAffair.value) return
  selectedAffair.value.micros_validated = v
  await affairStore.updateAffair(selectedAffair.value.affairid, { micros_validated: v })
}

// Supprimer l'affaire ouverte (soft-delete → corbeille), avec confirmation
async function deleteSelectedAffair() {
  const a = selectedAffair.value
  if (!a) return
  if (!confirm(`Supprimer l'affaire « ${a.name || 'Sans nom'} » ?\nElle sera placée dans la corbeille.`)) return
  const { error } = await supabase
    .from('affair')
    .update({ deleted_at: new Date().toISOString() })
    .eq('affairid', a.affairid)
  if (error) { alert('Erreur : ' + error.message); return }
  affairStore.selectAffair(null)
  await affairStore.fetchAffairs()
}

// --- Checks des caisses ---

// Confirmation avant navigation
onBeforeRouteLeave(() => {
  if (autoSaveTimer) {
    autoSaveNow()
  }
})

async function onAffairSelected(affair) {
  // Sauvegarder avant de changer si besoin
  if (autoSaveTimer) {
    await autoSaveNow()
  }

  activeRole.value = 'front'
  loadLabelsForRole()
  microGroupLabels.mg1 = (affair.mg1 && affair.mg1.trim()) || ''
  microGroupLabels.mg2 = (affair.mg2 && affair.mg2.trim()) || ''
  microGroupLabels.mg3 = (affair.mg3 && affair.mg3.trim()) || ''
  microGroupLabels.mg4 = (affair.mg4 && affair.mg4.trim()) || ''
  microGroupLabels.mg5 = (affair.mg5 && affair.mg5.trim()) || ''

  // Patcher les infos technicien si manquantes
  if (!affair.tech_phone || !affair.tech_email) {
    const userId = localStorage.getItem('cablemaster-userid') || 'T'
    try {
      const profile = JSON.parse(localStorage.getItem(`cablemaster-profile-${userId}`) || '{}')
      const patch = {}
      if (!affair.tech_firstname && profile.firstname) patch.tech_firstname = profile.firstname
      if (!affair.tech_phone && profile.phone) patch.tech_phone = profile.phone
      if (!affair.tech_email && profile.email) patch.tech_email = profile.email
      if (!affair.tech_name && (profile.lastname || profile.firstname)) patch.tech_name = profile.lastname || profile.firstname
      if (Object.keys(patch).length > 0) {
        Object.assign(affair, patch)
        await supabase.from('affair').update(patch).eq('affairid', affair.affairid)
      }
    } catch { /* ignore */ }
  }

  // Charger les câbles du catalogue de l'affaire ou de l'entreprise connectée.
  // Les deux requêtes (câbles + ordres) sont indépendantes → en PARALLÈLE (≈ 2× plus rapide).
  const catalogId = affair.catalog_id || localStorage.getItem('cablemaster-catalogid') || null
  const [, ordersResult] = await Promise.all([
    cableStore.fetchCables(catalogId ? parseInt(catalogId) : null),
    orderStore.fetchOrders({ affairid: affair.affairid }),
  ])
  buildJoinedData(ordersResult?.data || [], cableStore.cables)
  activeCableId.value = null
  editingCable.value = null
  showAddInput.value = false
  // Technicien : afficher d'abord la vue d'ensemble par poste ; master : grille d'édition directe
  overviewMode.value = false
  allCasesMode.value = false
}

function onAffairCreated(affair) {
  affairIsOpen.value = false
  editingAffair.value = null
  affairStore.selectAffair(affair)
  onAffairSelected(affair)
}

function onAffairEdit(affair) {
  editingAffair.value = affair
  affairIsOpen.value = true
}

// Le métier d'une ligne : les micros sont COMMUNS (caisse partagée), le reste suit le métier actif
function roleForCable(cable) {
  return cable.type === 'microphone' ? 'micro' : activeRole.value
}

function buildJoinedData(orders, cables) {
  allOrders.value = orders || []
  rebuildJoinedData(cables)
}

function rebuildJoinedData(cables = cableStore.cables) {
  const orderMap = {}
  for (const o of allOrders.value) {
    orderMap[`${o.cableid}-${o.role || 'front'}`] = o
  }

  joinedData.value = cables.map(cable => {
    const role = roleForCable(cable)
    const order = orderMap[`${cable.cableid}-${role}`]
    return {
      cableid: cable.cableid,
      affairid: selectedAffair.value?.affairid,
      tech_id: selectedAffair.value?.tech_id,
      role,
      done: order?.done ?? true,
      name: cable.name,
      brand: cable.brand,
      mic_category: cable.mic_category,
      type: cable.type,
      color: cable.color,
      total: cable.total,
      reserved: cable.reserved,
      info: cable.info,
      link: cable.link,
      image_url: cable.image_url,
      count: parseInt(order?.count) || 0,
      need: parseInt(order?.need) || 0,
      proposed: parseInt(order?.proposed) || 0,
      sublease: parseInt(order?.sublease) || 0,
      detail: order?.detail || '',
      spare_count: parseInt(order?.spare_count) || 0,
      tfc1: parseInt(order?.tfc1) || 0,
      tfc2: parseInt(order?.tfc2) || 0,
      tfc3: parseInt(order?.tfc3) || 0,
      tfc4: parseInt(order?.tfc4) || 0,
      tfc5: parseInt(order?.tfc5) || 0,
      tfc6: parseInt(order?.tfc6) || 0,
      z1: parseInt(order?.z1) || 0,
      z2: parseInt(order?.z2) || 0,
      z3: parseInt(order?.z3) || 0,
      z4: parseInt(order?.z4) || 0,
      z5: parseInt(order?.z5) || 0,
      z6: parseInt(order?.z6) || 0,
      tfc_done: order?.tfc_done ?? false,
    }
  })
}

// Vue globale regroupée par métier (+ caisse micro commune)
const ROLE_DEFS = [
  { role: 'front', label: 'FOH', color: '#3b82f6' },
  { role: 'monitor', label: 'Monitor', color: '#f59e0b' },
  { role: 'system', label: 'System', color: '#8b5cf6' },
  { role: 'stage', label: 'Stage', color: '#10b981' },
]
// Libellés FC d'un métier (repli créneau par créneau : métier → création affaire → vide)
function labelsForRole(role) {
  const a = selectedAffair.value
  const rl = (a?.role_labels && a.role_labels[role]) || {}
  const o = {}
  for (let i = 1; i <= 7; i++) {
    o[`lfc${i}`] = rl[`lfc${i}`] || (a?.[`lfc${i}`] && a[`lfc${i}`].trim()) || ''
  }
  return o
}

const casesByRole = computed(() => {
  const groups = ROLE_DEFS.map(def => {
    const map = {}
    for (const o of allOrders.value) if ((o.role || 'front') === def.role) map[o.cableid] = o
    const cables = []
    for (const cable of cableStore.cables) {
      const o = map[cable.cableid]
      if (!o) continue
      cables.push({
        cableid: cable.cableid, name: cable.name, type: cable.type,
        spare_count: o.spare_count || 0,
        tfc1: o.tfc1 || 0, tfc2: o.tfc2 || 0, tfc3: o.tfc3 || 0, tfc4: o.tfc4 || 0,
        tfc5: o.tfc5 || 0, tfc6: o.tfc6 || 0, tfc7: o.tfc7 || 0,
      })
    }
    return { ...def, isMicro: false, cables, labels: labelsForRole(def.role) }
  }).filter(g => g.cables.some(c => c.tfc1 || c.tfc2 || c.tfc3 || c.tfc4 || c.tfc5 || c.tfc6 || c.tfc7))

  // Caisse micro commune
  const mmap = {}
  for (const o of allOrders.value) if ((o.role || 'front') === 'micro') mmap[o.cableid] = o
  const micros = []
  for (const cable of cableStore.cables) {
    if (cable.type !== 'microphone') continue
    const o = mmap[cable.cableid]
    if (!o) continue
    micros.push({
      cableid: cable.cableid, name: cable.name, type: cable.type,
      spare_count: o.spare_count || 0,
      tfc1: o.tfc1 || 0, tfc2: o.tfc2 || 0, tfc3: o.tfc3 || 0, tfc4: o.tfc4 || 0, tfc5: o.tfc5 || 0,
    })
  }
  if (micros.length) groups.push({ role: 'micro', label: '🎤 Micros (commun)', color: '#eb910a', isMicro: true, cables: micros })
  return groups
})

const searchFiltered = computed(() =>
  joinedData.value.filter(c =>
    c.active !== false &&
    c.name.toLowerCase().includes(searchKey.value.toLowerCase())
  )
)

// Zones : filtré par type
const filteredJoinedData = computed(() => {
  if (typeChoose.value === '') return searchFiltered.value
  return searchFiltered.value.filter(c => c.type === typeChoose.value)
})

const totalSelected = computed(() =>
  joinedData.value.reduce((sum, c) => sum + calculateTotal(c), 0)
)

// Totaux par catégorie
const categoryTotals = computed(() => {
  const typeLabels = {
    speaker: 'HP', electrical: 'Elec', module: 'Modules',
    microphone: 'Micros', special: 'Spéciaux', other: 'Autres',
    c_type: 'Caisses', accessory: 'Access.', digital: 'Digital'
  }
  const counts = {}
  for (const c of joinedData.value) {
    const total = calculateTotal(c)
    if (total > 0) {
      counts[c.type] = (counts[c.type] || 0) + total
    }
  }
  return Object.entries(counts).map(([type, count]) => ({
    type,
    label: typeLabels[type] || type,
    count
  }))
})

// Quantité par type (pour les pastilles sur les boutons de type)
const typeCounts = computed(() => {
  const m = {}
  // Solo zone (Spare = 0, zones 1-6) → comptes du contenu de cette colonne par type
  if (soloMode.value && layout.value === 'cableTechBase' && zoneSoloFilter.value !== null) {
    const k = zoneSoloFilter.value
    for (const c of joinedData.value) {
      const n = k === 0 ? (c.spare_count || 0) : (c[`z${k}`] || 0)
      if (n > 0) m[c.type] = (m[c.type] || 0) + n
    }
    return m
  }
  // Solo flight-case → comptes par type du contenu de la FC choisie
  if (fcSolo.value && fcSoloFilter.value !== null) {
    const k = fcSoloFilter.value
    for (const c of joinedData.value) {
      const n = c[`tfc${k}`] || 0
      if (n > 0) m[c.type] = (m[c.type] || 0) + n
    }
    return m
  }
  // Solo Cablekit (ct) → comptes par type du contenu de la caisse choisie
  if (ctMode.value && ctSolo.value && ctSoloFilter.value !== null) {
    const k = ctSoloFilter.value
    for (const c of cableStore.cables) {
      const n = ctAllCounts.value[c.cableid]?.[k] || 0
      if (n > 0) m[c.type] = (m[c.type] || 0) + n
    }
    return m
  }
  // Sinon : totaux globaux par type
  for (const t of categoryTotals.value) m[t.type] = t.count
  return m
})

// Par type : est-ce que tous les câbles de ce type sont distribués ?
const distributedTypes = computed(() => {
  const result = {}
  const typeGroups = {}
  for (const c of joinedData.value) {
    const total = calculateTotal(c)
    if (total <= 0 && c.count <= 0) continue
    if (!typeGroups[c.type]) typeGroups[c.type] = []
    typeGroups[c.type].push(c)
  }
  for (const [type, cables] of Object.entries(typeGroups)) {
    result[type] = cables.every(c => {
      const cableTotal = calculateTotal(c) > 0 ? calculateTotal(c) : c.count
      const distributed = (c.tfc1 || 0) + (c.tfc2 || 0) + (c.tfc3 || 0) +
        (c.tfc4 || 0) + (c.tfc5 || 0) + (c.tfc6 || 0)
      return distributed >= cableTotal
    })
  }
  return result
})

// Par type : y a-t-il un câble en TROP (distribué > nécessaire) → erreur (coche rouge)
const overTypes = computed(() => {
  const result = {}
  for (const c of joinedData.value) {
    const cableTotal = calculateTotal(c) > 0 ? calculateTotal(c) : c.count
    const distributed = (c.tfc1 || 0) + (c.tfc2 || 0) + (c.tfc3 || 0) +
      (c.tfc4 || 0) + (c.tfc5 || 0) + (c.tfc6 || 0)
    if (cableTotal > 0 && distributed > cableTotal) result[c.type] = true
  }
  return result
})

// Est-ce que tous les câbles sélectionnés sont distribués dans les FC ?
const allDistributed = computed(() => {
  if (directMode.value) return false
  const selected = joinedData.value.filter(c => calculateTotal(c) > 0 || c.count > 0)
  if (selected.length === 0) return false
  return selected.every(c => {
    const cableTotal = calculateTotal(c) > 0 ? calculateTotal(c) : c.count
    const distributed = (c.tfc1 || 0) + (c.tfc2 || 0) + (c.tfc3 || 0) +
      (c.tfc4 || 0) + (c.tfc5 || 0) + (c.tfc6 || 0)
    return distributed >= cableTotal
  })
})

function getZoneTotal(cable) {
  return (
    (parseInt(cable.z1) || 0) +
    (parseInt(cable.z2) || 0) +
    (parseInt(cable.z3) || 0) +
    (parseInt(cable.z4) || 0) +
    (parseInt(cable.z5) || 0) +
    (parseInt(cable.z6) || 0) +
    (parseInt(cable.spare_count) || 0)
  )
}

function getTfcTotal(cable) {
  return (
    (parseInt(cable.tfc1) || 0) +
    (parseInt(cable.tfc2) || 0) +
    (parseInt(cable.tfc3) || 0) +
    (parseInt(cable.tfc4) || 0) +
    (parseInt(cable.tfc5) || 0) +
    (parseInt(cable.tfc6) || 0)
  )
}

function calculateTotal(cable) {
  if (directMode.value) return getTfcTotal(cable)
  return getZoneTotal(cable)
}

function colorForType(type) {
  const colors = {
    speaker: 'var(--color1)', electrical: '#f3e309', microphone: '#eb910a',
    module: '#ef4444', special: '#3b82f6', other: '#a16207',
    c_type: '#06b6d4', accessory: '#84cc16', digital: '#f97316',
    type8: '#ec4899', type9: '#14b8a6', type10: '#a855f7',
  }
  return colors[type] || '#ccc'
}
</script>

<style scoped>
.content-liste {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 auto;
  max-width: 900px;
  padding: 0 3px;
  text-align: center;
}
@media (min-width: 768px) {
  .content-liste {
    padding: 0 20px;
  }
  .cable-row {
    font-size: 16px;
  }
}
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg, #fff);
  width: 100%;
  padding-bottom: 2px;
  min-height: 90px;
}
/* En mode micro, les en-têtes sont dans MicroList → pas d'espace réservé ici */
.sticky-header.sticky-micro { min-height: 0; padding-bottom: 0; }
.affair-open-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0 2px;
}
.affair-open-name {
  flex: 1;
  min-width: 0;
  font-size: 16px;
  font-weight: 800;
  color: var(--text, #333);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.affair-del-btn {
  flex: none;
  background: transparent;
  border: 1px solid var(--border-light, #ddd);
  border-radius: 8px;
  font-size: 16px;
  padding: 4px 8px;
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
}
.affair-del-btn:active { background: rgba(239, 68, 68, 0.15); }
/* Vue d'ensemble par poste */
.overview { padding: 0 8px 24px; }
.ov-role { margin-bottom: 14px; }
.ov-role-head {
  display: flex; align-items: center; gap: 8px;
  font-weight: 800; font-size: 15px;
  border-left: 4px solid; padding: 4px 0 4px 8px;
  margin-bottom: 4px;
}
.ov-edit {
  margin-left: auto; background: transparent; border: none;
  font-size: 14px; cursor: pointer; padding: 2px 6px; box-shadow: none;
}
.ov-item {
  display: flex; align-items: center; gap: 10px;
  padding: 5px 8px; border-bottom: 1px solid var(--border-light, #eee);
  font-size: 14px; color: var(--text, #222);
}
.ov-qty {
  min-width: 28px; text-align: center; font-weight: 800;
  background: var(--bg-section, #f1f1f4); border-radius: 5px; padding: 1px 4px;
}
.ov-name { flex: 1; }
.ov-desc {
  white-space: pre-wrap; font-size: 13px; line-height: 1.4;
  background: var(--bg-section, #f1f1f4); color: var(--text, #222);
  border-radius: 8px; padding: 8px 10px; margin-bottom: 6px;
}
.ov-empty { text-align: center; color: var(--text-muted, #888); padding: 30px 12px; }
.ov-actions { text-align: center; margin-top: 12px; }
.ov-edit-all {
  background: #6b46c1; color: #fff; border: none; border-radius: 8px;
  padding: 8px 16px; font-size: 14px; font-weight: 700; cursor: pointer; margin-top: 10px;
}
.ov-validate {
  background: #22c55e; color: #fff; border: none; border-radius: 8px;
  padding: 8px 16px; font-size: 14px; font-weight: 800; cursor: pointer; margin-top: 10px; margin-left: 8px;
}
.ov-validate.small { padding: 5px 10px; font-size: 13px; margin: 0 6px 0 auto; }
.grid-team { margin: 4px 0 8px; padding: 0 4px; }
.ov-team { font-size: 13px; color: var(--text, #333); margin: 6px 0 10px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.ov-team-p { background: var(--bg-section, #eef); border-radius: 8px; padding: 2px 8px; }
.ov-team-p.asst { background: #cffafe; color: #155e75; }
.mode-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin: 8px 0;
}
/* Boutons de mode unifiés (Select / flight-case / Micro) */
.mode-btn {
  padding: 5px 12px;
  font-size: 13px;
  font-weight: 700;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  min-width: auto;
  box-shadow: none;
  background: var(--bg-card, #eee);
  color: var(--text, #555);
  transition: all 0.2s;
}
.mode-btn.active {
  background: #eb910a;
  color: #fff;
  border-color: #fff;
  box-shadow: 0 0 0 2px #eb910a, 0 0 8px rgba(235, 145, 10, 0.5);
  transform: scale(1.03);
}
.mode-arrow {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-muted, #999);
  line-height: 1;
  user-select: none;
}
.mode-separator {
  font-size: 12px;
  color: #999;
}
.direct-label {
  font-size: 13px;
  font-weight: 600;
  color: #3b82f6;
}
.direct-btn {
  background: #ebe7df;
  color: #333;
}
.direct-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}
.top-tabs {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin: 6px 0;
}
.top-tab {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 700;
  border: 2px solid var(--border-light, #ccc);
  border-radius: 8px;
  background: var(--bg-card, #f5f5f5);
  color: var(--text, #333);
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
  transition: all 0.15s;
}
.top-tab.active {
  border-color: var(--color1);
  background: var(--color1);
  color: #fff;
}
.top-tab.caisses-tab.active {
  background: #8b5cf6;
  border-color: #8b5cf6;
}
.allcases-mode-btn {
  cursor: pointer;
  margin: 3px;
  padding: 5px 10px;
  min-width: 50px;
  background: #8b5cf6;
  color: #fff;
  border: 1px solid #7c3aed;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}
.allcases-mode-btn.active {
  background: #7c3aed;
  border-color: #fff;
  box-shadow: 0 0 0 2px #8b5cf6;
}
.allcases-btn {
  background: #8b5cf6;
  color: #fff;
}
.allcases-btn.active {
  background: #7c3aed;
  border-color: #fff;
  box-shadow: 0 0 0 3px #8b5cf6, 0 0 12px rgba(139, 92, 246, 0.5);
  transform: scale(1.05);
}
.all-cases-view {
  width: 100%;
  max-width: 500px;
  margin: 10px auto;
}
.case-section {
  margin-bottom: 4px;
}
.case-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 2px solid var(--border, #e0e0e0);
  border-radius: 8px;
  cursor: pointer;
  background: var(--bg-card, #fafafa);
  user-select: none;
  transition: border-color 0.15s;
}
.case-header:active {
  transform: scale(0.98);
}
.case-title {
  flex: 1;
  font-size: 15px;
  font-weight: 700;
}
.case-title.fc-color { color: var(--color1); }
.case-title.micro-color { color: #eb910a; }
.case-count {
  font-size: 12px;
  font-weight: 700;
  background: var(--color1);
  color: #fff;
  padding: 2px 8px;
  border-radius: 10px;
}
.case-content {
  padding: 4px 0 4px 20px;
}
.case-done {
  font-size: 14px;
}
.case-check {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  cursor: pointer;
}
.all-ready-banner {
  text-align: center;
  padding: 12px;
  background: var(--color1);
  color: #fff;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  margin: 10px 0;
}
.case-cable {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  font-size: 14px;
  border-bottom: 1px solid var(--border-light, #eee);
}
.case-cable-name {
  color: var(--text, #333);
  font-weight: 600;
  flex: 1;
}
.case-cable-qty {
  color: var(--text-light, #888);
  font-weight: 700;
  width: 30px;
  text-align: center;
  flex-shrink: 0;
}
.all-cases-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 12px;
}
.sync-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.sync-dot.synced {
  background: var(--color1);
}
.sync-dot.saving {
  background: #ef4444;
  animation: pulse-sync 0.8s infinite;
}
@keyframes pulse-sync {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.content-button2 {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin: 6px 0;
}
.search {
  width: 120px;
  height: 24px;
  padding: 2px 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
}
.totals-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 6px 0;
  min-height: 24px;
  justify-content: center;
}
.total-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
  background: #f5f5f5;
  border: 2px solid #ccc;
}
.total-badge strong {
  color: #2c3e50;
}
.button3 {
  background: var(--color3) !important;
  color: #000;
}
.head-zone {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 0;
  margin-top: 10px;
  overflow: hidden;
}
.micro-toolbar { gap: 8px; overflow: visible; }
.subtract-toggle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #ccc;
  background: #fff;
  font-size: 18px;
  font-weight: 700;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  min-width: 28px;
  box-shadow: none;
  position: absolute;
  bottom: -14px;
  left: 10px;
}
.subtract-toggle.active {
  background: #ef4444;
  border-color: #ef4444;
  color: #fff;
}
.solo-toggle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #ccc;
  background: #fff;
  font-size: 14px;
  font-weight: 700;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  min-width: 28px;
  box-shadow: none;
  position: absolute;
  bottom: -14px;
  left: 44px;
}
.solo-toggle.active {
  background: #eb910a;
  border-color: #eb910a;
  color: #fff;
}
.step-toggle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #ccc;
  background: #fff;
  font-size: 9px;
  font-weight: 700;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  min-width: 28px;
  box-shadow: none;
  position: absolute;
  bottom: -14px;
  left: 78px;
}
.step-toggle.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}
.head-total-spacer {
  width: 28px;
  min-width: 28px;
}
.head-total-label {
  width: 32px;
  min-width: 32px;
  margin: 0 3px 0 1px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 55px;
  padding-bottom: 4px;
  font-size: 10px;
  font-weight: 700;
  color: var(--text);
  user-select: none;
  -webkit-user-select: none;
  position: sticky;
  left: 120px;
  z-index: 2;
  background: var(--bg);
}
.micro-view-bar { display: flex; align-items: center; gap: 6px; margin: 4px 0 8px; }
.micro-lp-hint { font-size: 11px; color: var(--text-muted, #999); font-style: italic; }
/* Pop-up photo + PDF d'un micro */
.mic-pop-ov { position: fixed; inset: 0; z-index: 2400; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; padding: 16px; }
.mic-pop { width: 100%; max-width: 420px; background: var(--bg-card, #1a1a2e); border: 1px solid var(--border, #3a3a55); border-radius: 14px; padding: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
.mic-pop-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.mic-pop-name { font-size: 16px; font-weight: 800; color: var(--text, #fff); }
.mic-pop-name small { font-size: 13px; font-weight: 600; color: var(--text-muted, #aaa); }
.mic-pop-close { background: none; border: none; font-size: 20px; color: var(--text-muted, #888); cursor: pointer; box-shadow: none; min-width: auto; }
.mic-pop-img { width: 100%; max-height: 60vh; object-fit: contain; border-radius: 10px; background: #fff; }
.mic-pop-noimg { padding: 40px; text-align: center; font-size: 18px; color: var(--text-muted, #888); background: var(--bg-input, #2a2a45); border-radius: 10px; }
.mic-pop-actions { display: flex; justify-content: center; margin-top: 10px; }
.mic-pop-pdf { display: inline-block; padding: 9px 18px; background: #dc2626; color: #fff; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 14px; }
.mic-pop-nopdf { font-size: 13px; color: var(--text-muted, #888); font-style: italic; }
.micro-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; padding: 4px 0; }
.micg-card { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px; border: 1px solid var(--border-light, #ddd); border-radius: 10px; background: var(--bg-card, #fff); cursor: pointer; }
.micg-card:active { background: rgba(0,0,0,0.05); }
.micg-img { width: 100%; height: 80px; object-fit: contain; border-radius: 6px; background: #fff; }
.micg-noimg { width: 100%; height: 80px; display: flex; align-items: center; justify-content: center; font-size: 30px; background: var(--bg-input, #f3f3f3); border-radius: 6px; }
.micg-name { font-size: 12px; font-weight: 800; text-align: center; color: var(--text, #222); line-height: 1.1; }
.micg-brand { font-size: 10px; color: var(--text-muted, #888); }
.micg-empty { grid-column: 1 / -1; text-align: center; color: var(--text-muted, #999); padding: 20px; }
.table-scroll {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x pan-y;
}
.scroll-inner {
  min-width: fit-content;
}
.sync-header {
  width: 100%;
  overflow-x: hidden;
  scrollbar-width: none;
  margin-top: 10px;
}
.sync-header::-webkit-scrollbar {
  display: none;
}
.sync-header-inner {
  display: flex;
  align-items: center;
  min-width: fit-content;
  gap: 0;
}
.head-zone-scroll {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 0;
  margin-top: 10px;
}
.head-spacer-sticky {
  width: 120px;
  min-width: 120px;
  position: sticky;
  left: 0;
  z-index: 2;
  background: var(--bg, #fff);
}
.ct-star-legend {
  display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
  line-height: 1.05; flex-shrink: 0; width: 32px;
}
.csl-star { color: var(--text, #fff); font-weight: 900; font-size: 18px; }
.csl-sub { color: var(--text, #fff); font-size: 10px; font-weight: 700; text-align: center; white-space: normal; }
.ct-btn-row {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  padding-bottom: 4px;
}
.mini-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid #ccc;
  background: #fff;
  font-size: 11px;
  font-weight: 700;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  min-width: 26px;
  box-shadow: none;
}
.mini-btn.active {
  background: #ef4444;
  border-color: #ef4444;
  color: #fff;
}
.mini-btn.active-orange {
  background: #eb910a;
  border-color: #eb910a;
  color: #fff;
}
.mini-btn.active-blue {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}
.help-wrap {
  position: relative;
  display: inline-flex;
}
.help-card {
  position: fixed;
  bottom: 40px;
  left: 15px;
  right: 15px;
  background: #ef4444;
  color: #fff;
  padding: 16px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.5);
  z-index: 300;
}
.help-card h4 {
  font-size: 17px;
  margin-bottom: 6px;
}
.help-card p {
  font-weight: 400;
  font-size: 14px;
  margin: 0;
}
.head-cols {
  display: flex;
  gap: 0;
}
.head-spacer {
  width: 120px;
  min-width: 120px;
  position: relative;
}
.head-spacer-fc {
  width: 120px;
  min-width: 120px;
  position: relative;
}
.head-total {
  width: 28px;
  min-width: 28px;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: #222;
}
.head-label-angled {
  width: 34px;
  height: 55px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  position: relative;
  cursor: pointer;
}
.head-label-angled-fc {
  width: 34px;
  height: 55px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  position: relative;
  cursor: pointer;
}
.head-label-angled span,
.head-label-angled input,
.head-label-angled-fc span,
.head-label-angled-fc input {
  display: block;
  transform: rotate(-55deg);
  transform-origin: bottom left;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 700;
  color: #222;
  position: absolute;
  bottom: 0;
  left: 38px;
}
.head-label-angled input,
.head-label-angled-fc input {
  width: 85px;
  border: none;
  border-bottom: 1px solid #ccc;
  background: transparent;
  padding: 4px 2px;
  outline: none;
  font-weight: 700;
  color: #222;
  -webkit-tap-highlight-color: transparent;
}
.head-label-angled input:focus,
.head-label-angled-fc input:focus {
  border-bottom-color: var(--color1);
}
.head-label-angled input::placeholder,
.head-label-angled-fc input::placeholder {
  color: #666;
  font-weight: 600;
}
.head-spare span {
  color: #e65100;
}
.ct-label-btn {
  background: #06b6d4 !important;
  border: 1px solid #0891b2;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 9px;
  font-weight: 700;
  color: #fff !important;
  display: inline-block;
  box-sizing: border-box;
  width: 66px;
  height: 20px;
  line-height: 16px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
}
.head-zone-scroll .head-label-angled-fc span,
.sync-header-inner .head-label-angled-fc span {
  left: 28px;
}
.solo-selected {
  background: #3b82f6 !important;
  color: #fff !important;
  border-color: #2563eb !important;
  border-radius: 4px;
  padding: 1px 4px;
}
.fc-clickable {
  cursor: pointer;
}
.fc-label-btn {
  background: var(--color1-light);
  border: 1px solid var(--color1);
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 9px;
  font-weight: 700;
  color: #2c3e50;
  display: inline-block;
  box-sizing: border-box;
  width: 66px;
  height: 20px;
  line-height: 16px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
}
.fc-clickable:hover .fc-label-btn {
  background: var(--color1);
  color: white;
}
button {
  cursor: pointer;
  margin: 3px;
  padding: 5px 10px;
  min-width: 50px;
  background: #ebe7df;
  border: 1px solid #000;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
  font-size: 12px;
}
.special-btn {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 700;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  min-width: auto;
  box-shadow: none;
  transition: all 0.2s;
}
.micro-btn {
  background: #eb910a;
  color: #fff;
}
.micro-btn.active {
  background: #d97706;
  border-color: #fff;
  box-shadow: 0 0 0 3px #eb910a, 0 0 12px rgba(235, 145, 10, 0.5);
  transform: scale(1.05);
}
.ctype-btn {
  background: #06b6d4;
  color: #fff;
}
.ctype-btn.disabled {
  background: #999;
  opacity: 0.5;
  cursor: not-allowed;
}
.ctype-btn.active {
  background: #0891b2;
  border-color: #fff;
  box-shadow: 0 0 0 3px #06b6d4, 0 0 12px rgba(6, 182, 212, 0.5);
  transform: scale(1.05);
}
.head-qty span {
  color: #eb910a;
  font-weight: 800;
}
.add-btn {
  width: 32px;
  height: 32px;
  font-size: 18px;
  font-weight: bold;
  padding: 0;
  min-width: 32px;
  background: var(--color1);
  color: white;
  border: none;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.quick-request { flex-wrap: wrap; }
.request-ok { width: 100%; text-align: center; color: #15803d; font-weight: 700; font-size: 13px; }
.quick-add {
  display: flex;
  gap: 6px;
  margin: 6px 0;
  align-items: center;
  justify-content: center;
}
.quick-add-input {
  flex: 1;
  max-width: 200px;
  padding: 8px 10px;
  border: 2px solid var(--color1);
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}
.quick-add-btn {
  background: var(--color1);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: none;
}
.cable-edit-panel {
  width: 100%;
  max-width: 360px;
  margin: 8px auto;
  padding: 10px;
  border: 2px solid var(--color3);
  border-radius: 8px;
  background: #fff8f0;
}
.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 800;
  color: #000;
}
.edit-header .close-btn {
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
}
.edit-readonly {
  padding: 4px 0;
  font-size: 13px;
  color: var(--text, #333);
}
.readonly-hint {
  font-size: 11px;
  color: var(--text-muted, #999);
  font-style: italic;
  margin-top: 4px;
}
.edit-fields {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.edit-fields label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #555;
}
.edit-fields input,
.edit-fields select {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}
.edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  justify-content: flex-end;
}
.edit-save {
  background: var(--color1);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: none;
}
.edit-delete {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: none;
}
.print-all-bar {
  margin: 10px 0;
  text-align: center;
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}
.print-all-bar .action-btn {
  background: var(--color3);
  border: none;
  color: #000;
  font-size: 13px;
  padding: 8px 16px;
  font-weight: 700;
  box-shadow: none;
  border-radius: 8px;
  transition: transform 0.1s, opacity 0.1s;
}
.qr-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
}
.label-editor-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex; justify-content: center; align-items: center; z-index: 250;
  padding: 16px;
}
.label-editor {
  background: var(--bg-card, #fff); color: var(--text, #333);
  border: 1px solid var(--border, #ddd); border-radius: 14px;
  padding: 16px; width: 100%; max-width: 340px; max-height: 80vh; overflow-y: auto;
}
.le-title { font-size: 16px; font-weight: 800; margin-bottom: 12px; }
.le-rows { display: flex; flex-direction: column; gap: 8px; }
.le-row { display: flex; align-items: center; gap: 8px; }
.le-tag {
  flex: 0 0 46px; font-size: 12px; font-weight: 700; color: var(--text-muted, #888);
}
.le-row input {
  flex: 1; min-width: 0; padding: 8px 10px; font-size: 16px;
  border: 1px solid var(--border-light, #ccc); border-radius: 8px;
  background: var(--bg-input, #fff); color: var(--text, #333);
}
.le-row input:focus { outline: none; border-color: var(--color1); }
.le-stereo {
  flex-shrink: 0; height: 30px; border-radius: 6px; white-space: nowrap;
  border: 1px solid var(--border-light, #ccc); background: var(--bg-input, #fff);
  color: var(--text-muted, #999); font-size: 12px; font-weight: 800; cursor: pointer;
  line-height: 1; padding: 0 8px; min-width: auto;
}
.le-stereo.on { background: #6b46c1; color: #fff; border-color: #6b46c1; }
.le-legend { font-size: 12px; color: var(--text-muted, #888); margin-top: 8px; text-align: center; }
/* Astérisque « par côté » : doit suivre le texte oblique, pas être repositionné en absolu */
.head-label-angled .zstar {
  position: static; transform: none; left: auto; bottom: auto;
  display: inline; color: #6b46c1; font-weight: 900;
  font-size: 17px; margin-right: 3px; line-height: 0;
}
:global(.dark) .zstar { color: #c4b5fd; }
.le-actions { display: flex; gap: 8px; margin-top: 14px; }
.le-cancel, .le-save {
  flex: 1; padding: 10px; border-radius: 8px; font-size: 14px; font-weight: 700;
  cursor: pointer; border: none; box-shadow: none;
}
.le-cancel { background: var(--bg-section, #eee); color: var(--text, #333); border: 1px solid var(--border-light, #ccc); }
.le-save { background: var(--color1); color: #fff; }
.qr-panel {
  background: var(--bg, #fff);
  border-radius: 14px;
  padding: 16px;
  max-width: 320px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}
.qr-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.qr-header h4 {
  margin: 0;
  font-size: 16px;
  color: var(--text, #333);
}
.qr-close {
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
}
.qr-image {
  text-align: center;
  margin: 10px 0;
}
.qr-image img {
  border-radius: 8px;
}
.qr-loading {
  text-align: center;
  padding: 20px;
  color: var(--text-muted, #999);
  font-size: 13px;
}
.qr-link {
  background: var(--color1);
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  text-align: center;
  cursor: pointer;
  word-break: break-all;
  margin: 8px 0;
}
.qr-text {
  background: var(--bg-card, #f5f5f5);
  color: var(--text, #333);
  border-radius: 8px;
  padding: 10px;
  font-size: 11px;
  max-height: 150px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 8px 0;
}
.qr-actions {
  display: flex;
  gap: 8px;
}
.qr-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
  background: var(--color1);
  color: #fff;
}
.print-all-bar .action-btn:active {
  transform: scale(0.93);
  opacity: 0.7;
}
.ct-tabs-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  margin: 6px 0;
}
.ct-tab-btn {
  padding: 5px 8px;
  font-size: 11px;
  font-weight: 700;
  border: 2px solid #06b6d4;
  border-radius: 6px;
  background: #fff;
  color: #06b6d4;
  cursor: pointer;
  min-width: auto;
  box-shadow: none;
}
.ct-tab-btn.active {
  background: #06b6d4;
  color: #fff;
}
.ctype-btn.editing {
  border-color: #ef4444;
  animation: pulse-edit 1s infinite;
}
@keyframes pulse-edit {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
.ct-edit-list {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}
.ct-edit-list .cable-row {
  display: flex;
  align-items: center;
  padding: 6px 4px;
  background: #fff;
  border-bottom: 1px solid #ddd;
  margin-bottom: 2px;
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.12);
}
.ct-edit-list .cable-row.row-band .cable-name {
  background: #d5d5d5;
  border-radius: 6px;
  padding-top: 4px;
  padding-bottom: 4px;
}
.ct-edit-list .cable-row.row-active .cable-name {
  border: 1.5px solid var(--color1);
  border-radius: 6px;
  color: var(--color1-dark);
  font-weight: 800;
}
.ct-edit-list .cable-row.row-active .ct-cell {
  border: 1.5px solid var(--color1);
}
.ct-edit-list .cable-name {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 700;
  padding-left: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
.ct-cell {
  width: 44px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #d5d5d5;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  margin-left: 6px;
}
.ct-edit-list .cable-row:not(.row-band) .ct-cell {
  background: #ebebeb;
}
.ct-cell.disabled {
  opacity: 0.5;
  cursor: default;
}
.ct-value {
  font-size: 16px;
  color: #bbb;
  font-weight: 500;
}
.ct-value.active {
  color: #2c3e50;
  font-weight: bold;
}
.ct-readonly-list {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}
.ct-readonly-list .cable-row {
  display: flex;
  align-items: center;
  padding: 8px 4px;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.ct-readonly-list .cable-row.row-band {
  background: #f5f5f5;
}
.ct-readonly-list .cable-name {
  flex: 1;
  font-size: 15px;
  font-weight: 700;
  padding-left: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ct-qty {
  width: 40px;
  text-align: center;
  font-size: 16px;
  font-weight: 800;
  color: #06b6d4;
}
.ct-empty-msg {
  text-align: center;
  padding: 30px;
  color: #999;
  font-size: 14px;
}
.ct-total-bar {
  text-align: center;
  padding: 10px;
  font-size: 14px;
  color: #666;
}
@media (min-width: 768px) {
  .head-label-angled,
  .head-label-angled-fc {
    width: 46px;
    height: 65px;
  }
  .head-label-angled span,
  .head-label-angled input,
  .head-label-angled-fc span,
  .head-label-angled-fc input {
    font-size: 14px;
  }
  .fc-label-btn,
  .ct-label-btn {
    width: 44px;
    height: 22px;
    font-size: 11px;
  }
  .head-spacer-sticky {
    width: 200px;
    min-width: 200px;
  }
  .head-total-label {
    width: 40px;
    min-width: 40px;
    height: 65px;
    font-size: 12px;
    left: 200px;
  }
}
</style>
