<template>
  <div class="master-affaire">
    <h2>Master Affaire</h2>

    <!-- Liste des affaires avec statut -->
    <button v-if="!selected && !showForm" class="btn-create-affair" @click="openNewAffair">＋ Nouvelle affaire</button>
    <div v-if="!selected" class="affair-tabs">
      <button :class="{ active: tab === 'all' }" @click="tab = 'all'">Toutes</button>
      <button :class="{ active: tab === 'draft' }" @click="tab = 'draft'">Brouillons</button>
      <button :class="{ active: tab === 'sent' }" @click="tab = 'sent'">Envoyées</button>
      <button :class="{ active: tab === 'done' }" @click="tab = 'done'">Terminées</button>
      <button :class="{ active: tab === 'trash' }" @click="tab = 'trash'">🗑</button>
    </div>
    <button v-if="selected" class="btn-back" @click="selected = null; showForm = false; showChatOnly = false">
      ← Retour aux affaires
    </button>

    <!-- Timeline -->
    <div v-if="showTimeline" class="timeline-panel">
      <div class="timeline-header">
        <span class="timeline-title">Planning</span>
        <button class="close-btn" @click="showTimeline = false">✕</button>
      </div>
      <div class="timeline-scroll" ref="timelineScroll">
        <div class="timeline-grid" :style="{ width: timelineWidth + 'px' }">
          <!-- Mois -->
          <div class="timeline-months">
            <div v-for="m in timelineMonths" :key="m.key" class="timeline-month" :style="{ left: m.left + 'px', width: m.width + 'px' }">
              {{ m.label }}
            </div>
          </div>
          <!-- Aujourd'hui -->
          <div class="timeline-today" :style="{ left: todayLeft + 'px' }"></div>
          <!-- Barres d'affaires -->
          <div v-for="(bar, idx) in timelineBars" :key="bar.id" class="timeline-bar" :style="{ top: (idx * 32 + 28) + 'px', left: bar.left + 'px', width: bar.width + 'px' }">
            <div class="bar-prep" v-if="bar.prepWidth > 0" :style="{ width: bar.prepWidth + 'px' }"></div>
            <div class="bar-event" :style="{ width: bar.eventWidth + 'px' }"></div>
            <span class="bar-label">{{ bar.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Formulaire création/édition -->
    <div v-if="showForm && !selected" class="form-panel">
      <div class="form-header">
        <h3>{{ editing ? 'Modifier' : 'Nouvelle affaire' }}</h3>
        <button class="close-btn" @click="showForm = false">✕</button>
      </div>

      <div class="form-row">
        <label>Nom de l'affaire *</label>
        <input v-model="form.name" placeholder="ex: Festival Été 2026" required />
      </div>
      <div class="form-row">
        <label>Référence</label>
        <input v-model="form.reference" placeholder="Code référence" />
      </div>

      <div class="form-row">
        <label>Type d'événement</label>
        <div class="type-picker">
          <button
            v-for="t in eventTypes"
            :key="t"
            type="button"
            class="type-btn"
            :class="{ active: form.event_type === t }"
            @click="form.event_type = form.event_type === t ? '' : t"
          >{{ t }}</button>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-row" style="flex: 2">
          <label>Lieu / salle</label>
          <input v-model="form.venue" placeholder="ex: Zénith de Paris" />
        </div>
        <div class="form-row" style="flex: 1">
          <label>Nb de jours</label>
          <input v-model.number="form.nb_days" type="number" min="1" placeholder="1" />
        </div>
      </div>

      <div class="form-row">
        <button type="button" class="btn-dates" @click="showCalendar = true">
          📅 Dates de l'événement<span v-if="form.tour_dates.length"> ({{ form.tour_dates.length }})</span>
        </button>
      </div>

      <div v-if="showCalendar" class="cal-overlay" @click.self="showCalendar = false">
        <div class="cal-modal">
          <div class="cal-modal-head">
            <span>📅 {{ form.name || 'Événement' }} — {{ form.tour_dates.length }} date(s)</span>
            <button class="close-btn" @click="showCalendar = false">✕</button>
          </div>
          <TourCalendar
            :tour-dates="form.tour_dates"
            :out-dates="form.out_dates"
            :back-dates="form.back_dates"
            :out-periods="form.out_periods"
            :back-periods="form.back_periods"
            :prep-days="form.prep_days"
            :prep-date="form.prep_date"
            @toggle="toggleTourDate"
            @toggle-out="toggleOutDate"
            @toggle-back="toggleBackDate"
            @cycle-prep="cyclePrepDay"
          />
        </div>
      </div>

      <div class="form-grid three">
        <div class="form-row">
          <DateField v-model="form.prep_date" label="Prépa" />
        </div>
        <div class="form-row">
          <DateField v-model="form.receipt_date" label="Chargement *" />
        </div>
        <div class="form-row">
          <DateField v-model="form.return_date" label="Déchargement" />
        </div>
      </div>

      <div class="form-section-title">Zones & Techniciens</div>
      <div class="zone-toggles">
        <button :class="{ active: form.front }" @click="form.front = !form.front" class="zone-btn facade">Front</button>
        <button :class="{ active: form.monitor }" @click="form.monitor = !form.monitor" class="zone-btn retour">Monitor</button>
        <button :class="{ active: form.system }" @click="form.system = !form.system" class="zone-btn systeme">System</button>
        <button :class="{ active: form.stage }" @click="form.stage = !form.stage" class="zone-btn scene">Stage</button>
      </div>

      <div v-if="form.front" class="zone-tech-block facade">
        <div class="zone-tech-header">🔵 Front</div>
        <div class="zone-tech-select">
          <select v-model="form.tech_email" @change="onTechSelect('front')">
            <option value="">-- Choisir --</option>
            <option v-for="t in technicians" :key="t.techid" :value="t.email">{{ t.firstname || '' }} {{ t.name }}</option>
          </select>
          <button class="btn-new-tech" @click="openNewTech('front')">+</button>
        </div>
        <div v-if="newTechZone === 'front'" class="new-tech-form">
          <input v-model="newTech.firstname" placeholder="Prénom" />
          <input v-model="newTech.name" placeholder="Nom" />
          <input v-model="newTech.phone" placeholder="Téléphone" />
          <input v-model="newTech.email" placeholder="Email" />
          <button @click="addTechForZone('front')">Ajouter</button>
        </div>
        <div v-if="form.tech_name" class="zone-tech-info">{{ form.tech_firstname || '' }} {{ form.tech_name }} <span v-if="form.tech_phone">· {{ form.tech_phone }}</span></div>
      </div>

      <div v-if="form.monitor" class="zone-tech-block retour">
        <div class="zone-tech-header">🟠 Monitor</div>
        <div class="zone-tech-select">
          <select v-model="form.tech_email_monitor" @change="onTechSelect('monitor')">
            <option value="">-- Choisir --</option>
            <option v-for="t in technicians" :key="t.techid" :value="t.email">{{ t.firstname || '' }} {{ t.name }}</option>
          </select>
          <button class="btn-new-tech" @click="openNewTech('monitor')">+</button>
        </div>
        <div v-if="newTechZone === 'monitor'" class="new-tech-form">
          <input v-model="newTech.firstname" placeholder="Prénom" />
          <input v-model="newTech.name" placeholder="Nom" />
          <input v-model="newTech.phone" placeholder="Téléphone" />
          <input v-model="newTech.email" placeholder="Email" />
          <button @click="addTechForZone('monitor')">Ajouter</button>
        </div>
        <div v-if="form.tech_name_monitor" class="zone-tech-info">{{ form.tech_firstname_monitor || '' }} {{ form.tech_name_monitor }} <span v-if="form.tech_phone_monitor">· {{ form.tech_phone_monitor }}</span></div>
      </div>

      <div v-if="form.system" class="zone-tech-block systeme">
        <div class="zone-tech-header">🟣 System</div>
        <div class="zone-tech-select">
          <select v-model="form.tech_email_system" @change="onTechSelect('system')">
            <option value="">-- Choisir --</option>
            <option v-for="t in technicians" :key="t.techid" :value="t.email">{{ t.firstname || '' }} {{ t.name }}</option>
          </select>
          <button class="btn-new-tech" @click="openNewTech('system')">+</button>
        </div>
        <div v-if="newTechZone === 'system'" class="new-tech-form">
          <input v-model="newTech.firstname" placeholder="Prénom" />
          <input v-model="newTech.name" placeholder="Nom" />
          <input v-model="newTech.phone" placeholder="Téléphone" />
          <input v-model="newTech.email" placeholder="Email" />
          <button @click="addTechForZone('system')">Ajouter</button>
        </div>
        <div v-if="form.tech_name_system" class="zone-tech-info">{{ form.tech_firstname_system || '' }} {{ form.tech_name_system }} <span v-if="form.tech_phone_system">· {{ form.tech_phone_system }}</span></div>
      </div>

      <div v-if="form.stage" class="zone-tech-block scene">
        <div class="zone-tech-header">🟢 Stage</div>
        <div class="zone-tech-select">
          <select v-model="form.tech_email_stage" @change="onTechSelect('stage')">
            <option value="">-- Choisir --</option>
            <option v-for="t in technicians" :key="t.techid" :value="t.email">{{ t.firstname || '' }} {{ t.name }}</option>
          </select>
          <button class="btn-new-tech" @click="openNewTech('stage')">+</button>
        </div>
        <div v-if="newTechZone === 'stage'" class="new-tech-form">
          <input v-model="newTech.firstname" placeholder="Prénom" />
          <input v-model="newTech.name" placeholder="Nom" />
          <input v-model="newTech.phone" placeholder="Téléphone" />
          <input v-model="newTech.email" placeholder="Email" />
          <button @click="addTechForZone('stage')">Ajouter</button>
        </div>
        <div v-if="form.tech_name_stage" class="zone-tech-info">{{ form.tech_firstname_stage || '' }} {{ form.tech_name_stage }} <span v-if="form.tech_phone_stage">· {{ form.tech_phone_stage }}</span></div>
      </div>

      <div class="form-row">
        <label>Matériel / Notes</label>
        <textarea v-model="form.description" rows="5" placeholder="Systèmes K2, K3, wedge, subs, amplis..." ref="descriptionRef"></textarea>
      </div>

      <div class="form-row">
        <label>Documents joints</label>
        <input type="file" @change="onFileSelect" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" multiple class="file-input" />
        <div v-for="(f, i) in attachmentFiles" :key="i" class="attachment-info">📎 {{ f.name }}</div>
        <div v-for="(name, i) in existingAttachments" :key="'ex'+i" class="attachment-info">📎 {{ name }}</div>
      </div>

      <div class="form-actions">
        <button class="btn-save" @click="saveAffair" :disabled="!form.name">
          {{ editing ? 'Enregistrer' : 'Créer' }}
        </button>
        <button v-if="editing" class="btn-draft" @click="setStatus('draft')">📝 Brouillon</button>
        <button v-if="editing" class="btn-delete" @click="deleteAffair">🗑 Supprimer</button>
      </div>
    </div>

    <!-- Liste -->
    <div class="affair-list" v-show="!showForm || selected">
      <div
        v-for="affair in filteredAffairs"
        :key="affair.affairid"
        v-show="!selected || selected.affairid === affair.affairid"
        class="affair-card"
        :class="{ selected: selected?.affairid === affair.affairid, trashed: tab === 'trash' }"
        @click="tab !== 'trash' && selectAffair(affair)"
      >
        <div class="card-top">
          <span class="card-status" :class="affair.status || 'draft'">{{ statusLabel(affair.status) }}</span>
          <span v-if="unreadAffairs[affair.affairid]" class="unread-star" @click.stop="openChatOnly(affair)">★</span>
          <span class="card-name">{{ affair.name }}</span>
          <div class="card-dates" @click.stop="showTimeline = !showTimeline">
            <span v-if="prepSummary(affair)" class="date-prep">🔧 {{ prepSummary(affair) }}</span>
            <span v-if="prepSummary(affair)" class="date-sep"></span>
            <span v-if="outSummary(affair)" class="date-event">📦→ {{ outSummary(affair) }}</span>
            <span v-if="backSummary(affair)" class="date-arrow">·</span>
            <span v-if="backSummary(affair)" class="date-return">←📦 {{ backSummary(affair) }}</span>
          </div>
        </div>
        <div class="card-bottom">
          <div class="card-techs">
            <div v-if="affair.front" class="tech-zone-item">
              <span class="zone-dot facade"></span>
              <span class="tech-firstname">{{ affair.tech_name || '?' }}</span>
            </div>
            <div v-if="affair.monitor" class="tech-zone-item">
              <span class="zone-dot retour"></span>
              <span class="tech-firstname">{{ affair.tech_name_monitor || '?' }}</span>
            </div>
            <div v-if="affair.system" class="tech-zone-item">
              <span class="zone-dot systeme"></span>
              <span class="tech-firstname">{{ affair.tech_name_system || '?' }}</span>
            </div>
            <div v-if="affair.stage" class="tech-zone-item">
              <span class="zone-dot scene"></span>
              <span class="tech-firstname">{{ affair.tech_name_stage || '?' }}</span>
            </div>
          </div>
          <!-- Infos : type · lieu · nb jours · dates (sous les dates, à droite) -->
          <div class="card-meta">
            <span v-if="affair.event_type" class="meta-type">{{ affair.event_type }}</span>
            <span v-if="affair.venue" class="meta-venue">📍 {{ affair.venue }}</span>
            <span v-if="affair.nb_days" class="meta-days">📆 {{ affair.nb_days }} j</span>
            <span v-if="affair.tour_dates && affair.tour_dates.length" class="meta-dates">🗓 {{ affair.tour_dates.length }} dates</span>
          </div>
          <div v-if="tab === 'trash'" class="card-action-btns">
            <button class="action-tab-btn" @click.stop="restoreAffair(affair)" title="Restaurer">♻️</button>
            <button class="action-tab-btn danger" @click.stop="purgeAffair(affair)" title="Supprimer définitivement">⊗</button>
          </div>
        </div>
        <!-- Aperçu message non lu -->
        <div v-if="unreadAffairs[affair.affairid] && expandedTab !== 'chat'" class="card-unread-msg">
          💬 {{ unreadAffairs[affair.affairid] }}
        </div>

        <!-- Panneau Chat -->
        <div v-if="selected?.affairid === affair.affairid && expandedTab === 'chat'" class="card-expanded" @click.stop>
          <div class="master-chat">
            <div class="chat-messages-master">
              <div v-for="msg in affairMessages" :key="msg.messageid" class="chat-msg-m" :class="msg.sender_role">
                <span class="msg-icon">{{ msg.sender_role === 'tech' ? '🧑‍🔧' : '🏢' }}</span>
                <div class="msg-content">
                  <p>{{ msg.text }}</p>
                  <span class="msg-time-m">{{ formatTime(msg.created_at) }}</span>
                </div>
              </div>
              <div v-if="affairMessages.length === 0" class="chat-empty-m">Aucun message</div>
            </div>
            <div class="chat-input-m">
              <input v-model="masterReply" placeholder="Répondre..." @keydown.enter="sendMasterReply(affair)" />
              <button @click="sendMasterReply(affair)" :disabled="!masterReply.trim()">Envoyer</button>
            </div>
            <button v-if="unreadAffairs[affair.affairid]" class="btn-mark-read" @click.stop="markReadByMaster(affair)">
              ✓ Marquer comme traité
            </button>
          </div>
        </div>

        <!-- Panneau Fiche -->
        <div v-if="selected?.affairid === affair.affairid && expandedTab === 'fiche'" class="card-expanded" @click.stop>
          <!-- Contacter tous -->
          <a v-if="getAllEmails(affair).length > 0" :href="'mailto:' + getAllEmails(affair).join(',')" class="fiche-contact-all">📩 Contacter tous</a>

          <!-- Personnes par zone -->
          <div v-for="zone in getAffairZones(affair)" :key="zone.key" class="fiche-person">
            <div class="fiche-person-header" :class="zone.css">{{ zone.icon }} {{ zone.label }}</div>
            <div class="fiche-person-body">
              <div class="fiche-person-line">
                <span class="fiche-person-name">{{ zone.firstname }} {{ zone.name }}</span>
                <span v-if="zone.phone" class="fiche-person-phone">{{ zone.phone }}</span>
                <span v-if="zone.email" class="fiche-person-email">{{ zone.email }}</span>
              </div>
              <div v-if="zone.phone || zone.email" class="fiche-person-actions">
                <a v-if="zone.phone" :href="'tel:' + zone.phone" class="fiche-action-btn call">📞 Appeler</a>
                <a v-if="zone.phone" :href="'sms:' + zone.phone" class="fiche-action-btn sms">💬 SMS</a>
                <a v-if="zone.email" :href="'mailto:' + zone.email" class="fiche-action-btn email">📩 Email</a>
              </div>
              <div v-if="!zone.phone && !zone.email" class="fiche-no-contact">Pas de coordonnées renseignées</div>
            </div>
          </div>
          <!-- Dates -->
          <div class="fiche-dates">
            <div v-if="affair.prep_date">🔧 Prépa : {{ formatDate(affair.prep_date) }}</div>
            <div>📦 Chargement : {{ formatDate(affair.receipt_date) }}</div>
            <div v-if="affair.return_date">↩ Déchargement : {{ formatDate(affair.return_date) }}</div>
          </div>
          <div v-if="affair.description" class="fiche-description">
            <strong>Notes :</strong> {{ affair.description }}
          </div>
        </div>

        <!-- Panneau Matériel (vue flight-cases) -->
        <div v-if="selected?.affairid === affair.affairid && expandedTab === 'materiel'" class="card-expanded" @click.stop>
          <div v-if="fcLoading" class="fc-loading">Chargement...</div>
          <template v-else>
            <!-- Front -->
            <div v-if="affair.front" class="zone-block">
              <div class="zone-banner facade">🔵 Front — {{ affair.tech_name || '?' }}</div>
              <AllCasesView
                v-if="allCables.length > 0"
                :cables="allCables"
                :affair-id="affair.affairid"
                :fc-labels="{ lfc1: affair.lfc1, lfc2: affair.lfc2, lfc3: affair.lfc3, lfc4: affair.lfc4, lfc5: affair.lfc5, lfc6: affair.lfc6, lfc7: affair.lfc7 }"
              />
              <div v-else class="zone-empty">Aucun matériel préparé</div>
            </div>
            <!-- Monitor -->
            <div v-if="affair.monitor" class="zone-block">
              <div class="zone-banner retour">🟠 Monitor — {{ affair.tech_name_monitor || '?' }}</div>
              <div class="zone-empty">Aucun matériel préparé</div>
            </div>
            <!-- System -->
            <div v-if="affair.system" class="zone-block">
              <div class="zone-banner systeme">🟣 System — {{ affair.tech_name_system || '?' }}</div>
              <div class="zone-empty">Aucun matériel préparé</div>
            </div>
            <!-- Stage -->
            <div v-if="affair.stage" class="zone-block">
              <div class="zone-banner scene">🟢 Stage — {{ affair.tech_name_stage || '?' }}</div>
              <div class="zone-empty">Aucun matériel préparé</div>
            </div>
            <!-- Calculateur amplis -->
            <AmpCalculator :description="affair.description || ''" />
          </template>
        </div>
      </div>
      <div v-if="filteredAffairs.length === 0" class="empty">{{ tab === 'trash' ? 'Corbeille vide' : 'Aucune affaire' }}</div>
    </div>
    <!-- Message -->
    <div v-if="message" class="message" :class="messageType">{{ message }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { supabase } from '../lib/supabase'
import AllCasesView from '../components/AllCasesView.vue'
import AmpCalculator from '../components/AmpCalculator.vue'
import DateField from '../components/DateField.vue'
import TourCalendar from '../components/TourCalendar.vue'

const tab = ref('all')
const affairs = ref([])
const technicians = ref([])
const selected = ref(null)
const showForm = ref(false)
const showAddTech = ref(false)
const editing = ref(null)
const message = ref('')
const messageType = ref('')
const showCalendar = ref(false)

function toggleTourDate(dateStr) {
  const arr = form.tour_dates.includes(dateStr)
    ? form.tour_dates.filter(d => d !== dateStr)
    : [...form.tour_dates, dateStr].sort()
  form.tour_dates = arr
}

// Cycle un jour : rien → après-midi (pm, flèche haut) → matin (am, flèche bas) → rien
function cycleDayPeriod(datesKey, periodsKey, dateStr) {
  const has = form[datesKey].includes(dateStr)
  const period = form[periodsKey]?.[dateStr]
  if (!has) {
    form[datesKey] = [...form[datesKey], dateStr].sort()
    form[periodsKey] = { ...form[periodsKey], [dateStr]: 'pm' }
  } else if (period !== 'am') {
    form[periodsKey] = { ...form[periodsKey], [dateStr]: 'am' }
  } else {
    form[datesKey] = form[datesKey].filter(d => d !== dateStr)
    const p = { ...form[periodsKey] }; delete p[dateStr]; form[periodsKey] = p
  }
}

// Nb de jours = de la 1ʳᵉ sortie (ou prépa) au dernier retour, inclus
function updateNbDays() {
  const all = [...(form.out_dates || []), ...(form.back_dates || [])].filter(Boolean).sort()
  if (!all.length) return
  const d1 = new Date(all[0] + 'T00:00:00')
  const d2 = new Date(all[all.length - 1] + 'T00:00:00')
  form.nb_days = Math.round((d2 - d1) / 86400000) + 1
}

function toggleOutDate(dateStr) {
  cycleDayPeriod('out_dates', 'out_periods', dateStr)
  form.receipt_date = form.out_dates[0] || ''
  updateNbDays()
}

function toggleBackDate(dateStr) {
  cycleDayPeriod('back_dates', 'back_periods', dateStr)
  form.return_date = form.back_dates[form.back_dates.length - 1] || ''
  updateNbDays()
}

// Prépa : rien → demi-haut → demi-bas → journée pleine → rien
function cyclePrepDay(dateStr) {
  const cur = form.prep_days?.[dateStr]
  const next = { top: 'bottom', bottom: 'full', full: null }
  const nv = cur ? next[cur] : 'top'
  const p = { ...form.prep_days }
  if (nv) p[dateStr] = nv; else delete p[dateStr]
  form.prep_days = p
  // La 1ʳᵉ prépa alimente le champ "Prépa"
  const keys = Object.keys(form.prep_days).sort()
  form.prep_date = keys[0] || form.prep_date
}

const companyId = parseInt(localStorage.getItem('cablemaster-companyid')) || null
const catalogId = parseInt(localStorage.getItem('cablemaster-catalogid')) || null

const eventTypes = ['Concert', 'Tournée', 'Festival', 'Événement']

const form = reactive({
  name: '',
  reference: '',
  event_type: '',
  venue: '',
  nb_days: null,
  tour_dates: [],
  out_dates: [],
  back_dates: [],
  out_periods: {},
  back_periods: {},
  prep_days: {},
  tech_name: '', tech_firstname: '', tech_email: '', tech_phone: '',
  tech_name_monitor: '', tech_firstname_monitor: '', tech_email_monitor: '', tech_phone_monitor: '',
  tech_name_system: '', tech_firstname_system: '', tech_email_system: '', tech_phone_system: '',
  tech_name_stage: '', tech_firstname_stage: '', tech_email_stage: '', tech_phone_stage: '',
  prep_date: '',
  receipt_date: '',
  return_date: '',
  front: false,
  monitor: false,
  system: false,
  stage: false,
  description: '',
  attachment_name: '',
  attachment_url: '',
})

const newTech = reactive({ firstname: '', name: '', email: '', phone: '' })

function resetForm() {
  Object.assign(form, {
    name: '', reference: '', event_type: '', venue: '', nb_days: null, tour_dates: [], out_dates: [], back_dates: [], out_periods: {}, back_periods: {}, prep_days: {},
    tech_name: '', tech_firstname: '', tech_email: '', tech_phone: '',
    tech_name_monitor: '', tech_firstname_monitor: '', tech_email_monitor: '', tech_phone_monitor: '',
    tech_name_system: '', tech_firstname_system: '', tech_email_system: '', tech_phone_system: '',
    tech_name_stage: '', tech_firstname_stage: '', tech_email_stage: '', tech_phone_stage: '',
    prep_date: '', receipt_date: '', return_date: '',
    front: false, monitor: false, system: false, stage: false,
    description: '', attachment_name: '', attachment_url: '',
  })
  existingAttachments.value = []
  attachmentFiles.value = []
}

function openNewAffair() {
  resetForm()
  editing.value = null
  selected.value = null
  showForm.value = true
}
const newTechZone = ref('')
const attachmentFiles = ref([])
const existingAttachments = ref([])

const unreadAffairs = ref({})
const affairMessages = ref([])
const masterReply = ref('')
const showChatOnly = ref(false)
const expandedTab = ref('')
const allCables = ref([])
const fcLoading = ref(false)
const showTimeline = ref(false)
const timelineScroll = ref(null)

const DAY_PX = 12 // pixels par jour

const timelineRange = computed(() => {
  const dates = []
  for (const a of affairs.value) {
    if (a.prep_date) dates.push(new Date(a.prep_date))
    if (a.receipt_date) dates.push(new Date(a.receipt_date))
    if (a.return_date) dates.push(new Date(a.return_date))
  }
  if (dates.length === 0) return { start: new Date(), end: new Date() }
  const min = new Date(Math.min(...dates))
  const max = new Date(Math.max(...dates))
  // Ajouter 7j de marge de chaque côté
  min.setDate(min.getDate() - 7)
  max.setDate(max.getDate() + 7)
  return { start: min, end: max }
})

function daysBetween(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

const timelineWidth = computed(() => {
  const { start, end } = timelineRange.value
  return Math.max(daysBetween(start, end) * DAY_PX, 300)
})

const todayLeft = computed(() => {
  const { start } = timelineRange.value
  return daysBetween(start, new Date()) * DAY_PX
})

const timelineMonths = computed(() => {
  const { start, end } = timelineRange.value
  const months = []
  const d = new Date(start.getFullYear(), start.getMonth(), 1)
  const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
  while (d <= end) {
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const left = daysBetween(start, d) * DAY_PX
    const width = daysBetween(d, nextMonth > end ? end : nextMonth) * DAY_PX
    months.push({ key: d.toISOString(), label: monthNames[d.getMonth()] + ' ' + d.getFullYear(), left: Math.max(left, 0), width })
    d.setMonth(d.getMonth() + 1)
  }
  return months
})

const timelineBars = computed(() => {
  const { start } = timelineRange.value
  return affairs.value.map(a => {
    const prepDate = a.prep_date ? new Date(a.prep_date) : null
    const eventDate = a.receipt_date ? new Date(a.receipt_date) : new Date()
    const returnDate = a.return_date ? new Date(a.return_date) : eventDate
    const barStart = prepDate || eventDate
    const left = daysBetween(start, barStart) * DAY_PX
    const totalDays = Math.max(daysBetween(barStart, returnDate), 1)
    const prepDays = prepDate ? daysBetween(prepDate, eventDate) : 0
    const eventDays = Math.max(daysBetween(eventDate, returnDate), 1)
    return {
      id: a.affairid,
      name: a.name,
      left,
      width: totalDays * DAY_PX,
      prepWidth: prepDays * DAY_PX,
      eventWidth: eventDays * DAY_PX,
    }
  })
})

// Scroll vers aujourd'hui quand on ouvre la timeline
watch(showTimeline, async (val) => {
  if (val) {
    await nextTick()
    if (timelineScroll.value) {
      timelineScroll.value.scrollLeft = Math.max(todayLeft.value - 100, 0)
    }
  }
})

async function toggleTab(affair, tab) {
  if (selected.value?.affairid === affair.affairid && expandedTab.value === tab) {
    expandedTab.value = ''
    return
  }
  selected.value = affair
  editing.value = affair
  expandedTab.value = tab
  showForm.value = false

  if (tab === 'chat') {
    const { data } = await supabase
      .from('message')
      .select('*')
      .eq('affairid', affair.affairid)
      .order('created_at', { ascending: true })
    affairMessages.value = data || []
  }

  if (tab === 'materiel') {
    fcLoading.value = true
    allCables.value = []
    const { data } = await supabase
      .from('order')
      .select('*, cable(name, type)')
      .eq('affairid', affair.affairid)
    // Joindre les infos cable dans chaque order
    allCables.value = (data || []).map(o => ({
      ...o,
      name: o.cable?.name || '?',
      type: o.cable?.type || '',
    })).filter(c =>
      (c.spare_count || 0) + (c.z1 || 0) + (c.z2 || 0) + (c.z3 || 0) +
      (c.z4 || 0) + (c.z5 || 0) + (c.z6 || 0) +
      (c.tfc1 || 0) + (c.tfc2 || 0) + (c.tfc3 || 0) + (c.tfc4 || 0) +
      (c.tfc5 || 0) + (c.tfc6 || 0) + (c.tfc7 || 0) > 0
    )
    fcLoading.value = false
  }
}

onMounted(() => {
  loadAffairs()
  loadTechnicians()
})

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

async function loadAffairs() {
  let query = supabase.from('affair').select('*').is('deleted_at', null).order('prep_date', { ascending: true, nullsFirst: false }).order('receipt_date', { ascending: true })
  if (catalogId) query = query.eq('catalog_id', catalogId)
  const { data } = await query
  const now = new Date()
  // Passer en "done" les affaires dont la date de retour est passée
  for (const a of data || []) {
    if (a.return_date && new Date(a.return_date) < now && a.status !== 'done') {
      a.status = 'done'
      await supabase.from('affair').update({ status: 'done' }).eq('affairid', a.affairid)
    }
  }
  affairs.value = data || []

  // Charger les messages non lus par le master
  const unread = {}
  for (const a of affairs.value) {
    const { data: msgs } = await supabase
      .from('message')
      .select('text')
      .eq('affairid', a.affairid)
      .eq('sender_role', 'tech')
      .eq('read_by_master', false)
      .order('created_at', { ascending: false })
      .limit(1)
    if (msgs?.length > 0) {
      unread[a.affairid] = msgs[0].text.substring(0, 60) + (msgs[0].text.length > 60 ? '...' : '')
    }
  }
  unreadAffairs.value = unread
}

async function loadTechnicians() {
  if (!companyId) return
  const { data } = await supabase.from('technician').select('*').eq('company_id', companyId).order('name')
  technicians.value = data || []
}

const trashedAffairs = ref([])
async function loadTrashed() {
  let query = supabase.from('affair').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
  if (catalogId) query = query.eq('catalog_id', catalogId)
  const { data } = await query
  trashedAffairs.value = data || []
}

const filteredAffairs = computed(() => {
  if (tab.value === 'trash') return trashedAffairs.value
  if (tab.value === 'all') return affairs.value
  return affairs.value.filter(a => (a.status || 'draft') === tab.value)
})

watch(tab, (t) => { if (t === 'trash') loadTrashed() })

async function restoreAffair(affair) {
  const { error } = await supabase.from('affair').update({ deleted_at: null }).eq('affairid', affair.affairid)
  if (error) { showMessage('Erreur: ' + error.message, 'error'); return }
  await Promise.all([loadAffairs(), loadTrashed()])
  showMessage('Affaire restaurée', 'success')
}

async function purgeAffair(affair) {
  if (!confirm(`Supprimer DÉFINITIVEMENT "${affair.name}" ? Cette action est irréversible.`)) return
  const { error } = await supabase.from('affair').delete().eq('affairid', affair.affairid)
  if (error) { showMessage('Erreur: ' + error.message, 'error'); return }
  await loadTrashed()
  showMessage('Affaire supprimée définitivement', 'success')
}

function statusLabel(s) {
  const labels = { draft: '📝', sent: '📩', in_progress: '🔧', done: '✅' }
  return labels[s] || labels.draft
}

const months = ['jan','fév','mars','avr','mai','juin','juil','août','sept','oct','nov','déc']
function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return `${d.getDate()} ${months[d.getMonth()]}`
}

// Résumés issus du calendrier (jours multiples + AM/PM) pour la carte
function shortDate(d) { const [, m, dd] = (d || '').split('-'); return dd ? `${dd}/${m}` : '' }
function prepTag(p) { return p === 'top' ? ' après-midi' : p === 'bottom' ? ' matin' : ' (journée)' }
function periodTag(p) { return p === 'pm' ? ' après-midi' : p === 'am' ? ' matin' : '' }

function prepSummary(a) {
  const map = a.prep_days && typeof a.prep_days === 'object' ? a.prep_days : {}
  const keys = Object.keys(map).sort()
  if (!keys.length) return a.prep_date ? shortDate(a.prep_date) : ''
  return keys.map(d => shortDate(d) + prepTag(map[d])).join(' · ')
}
function outSummary(a) {
  const arr = Array.isArray(a.out_dates) ? [...a.out_dates].sort() : []
  const per = a.out_periods || {}
  if (!arr.length) return a.receipt_date ? shortDate(a.receipt_date) : ''
  return arr.map(d => shortDate(d) + periodTag(per[d])).join(' · ')
}
function backSummary(a) {
  const arr = Array.isArray(a.back_dates) ? [...a.back_dates].sort() : []
  const per = a.back_periods || {}
  if (!arr.length) return a.return_date ? shortDate(a.return_date) : ''
  return arr.map(d => shortDate(d) + periodTag(per[d])).join(' · ')
}

function getAffairZones(affair) {
  const zones = []
  if (affair.front) {
    zones.push({
      key: 'front', css: 'facade', icon: '🔵', label: 'Front',
      name: affair.tech_name || '?',
      firstname: affair.tech_firstname || '',
      phone: affair.tech_phone || '',
      email: affair.tech_email || '',
    })
  }
  if (affair.monitor) {
    zones.push({
      key: 'monitor', css: 'retour', icon: '🟠', label: 'Monitor',
      name: affair.tech_name_monitor || '?',
      firstname: affair.tech_firstname_monitor || '',
      phone: affair.tech_phone_monitor || '',
      email: affair.tech_email_monitor || '',
    })
  }
  if (affair.system) {
    zones.push({
      key: 'system', css: 'systeme', icon: '🟣', label: 'System',
      name: affair.tech_name_system || '?',
      firstname: affair.tech_firstname_system || '',
      phone: affair.tech_phone_system || '',
      email: affair.tech_email_system || '',
    })
  }
  if (affair.stage) {
    zones.push({
      key: 'stage', css: 'scene', icon: '🟢', label: 'Stage',
      name: affair.tech_name_stage || '?',
      firstname: affair.tech_firstname_stage || '',
      phone: affair.tech_phone_stage || '',
      email: affair.tech_email_stage || '',
    })
  }
  return zones
}

function getAllEmails(affair) {
  const emails = []
  if (affair.tech_email) emails.push(affair.tech_email)
  if (affair.tech_email_monitor && !emails.includes(affair.tech_email_monitor)) emails.push(affair.tech_email_monitor)
  if (affair.tech_email_system && !emails.includes(affair.tech_email_system)) emails.push(affair.tech_email_system)
  if (affair.tech_email_stage && !emails.includes(affair.tech_email_stage)) emails.push(affair.tech_email_stage)
  return emails
}

async function sendZoneInvite(affair, zone) {
  const techEmail = affair.tech_email || ''
  const techName = affair.tech_name || 'Technicien'
  const affairName = affair.name
  const dateStr = formatDate(affair.receipt_date)
  const zoneName = zone === 'front' ? 'Façade' : zone === 'monitor' ? 'Retours' : zone === 'system' ? 'Système' : 'Scène'
  const link = `${window.location.origin}/?affair=${affair.affairid}`

  const subject = encodeURIComponent(`Invitation : ${affairName} - ${zoneName}`)
  const body = encodeURIComponent(
`Bonjour ${techName},

Vous êtes invité(e) à préparer le câblage ${zoneName} pour l'affaire "${affairName}" (${dateStr}).

Merci de cliquer sur le lien ci-dessous pour renseigner vos besoins :

${link}

Cordialement`)

  // Ouvrir le mail
  if (techEmail) {
    window.location.href = `mailto:${techEmail}?subject=${subject}&body=${body}`
  }

  // Enregistrer l'envoi dans la base
  const key = `invite_${zone}`
  const inviteData = affair._invites || {}
  inviteData[zone] = { sent_at: new Date().toISOString(), email: techEmail }
  affair._invites = inviteData

  // Sauvegarder le statut d'envoi
  await supabase.from('affair').update({
    status: 'sent',
    description: (affair.description || '')
  }).eq('affairid', affair.affairid)

  // Marquer visuellement
  const uiKey = `_invite${zone.charAt(0).toUpperCase() + zone.slice(1)}`
  affair[uiKey] = true

  await loadAffairs()
}

async function openChatOnly(affair) {
  selected.value = affair
  editing.value = affair
  showForm.value = false
  showChatOnly.value = true
  const { data } = await supabase
    .from('message')
    .select('*')
    .eq('affairid', affair.affairid)
    .order('created_at', { ascending: true })
  affairMessages.value = data || []
}

async function selectAffair(affair) {
  if (selected.value?.affairid === affair.affairid) {
    selected.value = null
    showForm.value = false
    showChatOnly.value = false
    return
  }
  showChatOnly.value = false
  selected.value = affair
  editing.value = affair
  showForm.value = true
  masterReply.value = ''
  Object.assign(form, {
    name: affair.name || '',
    reference: affair.reference || '',
    event_type: affair.event_type || '',
    venue: affair.venue || '',
    nb_days: affair.nb_days ?? null,
    tour_dates: Array.isArray(affair.tour_dates) ? [...affair.tour_dates] : [],
    out_dates: Array.isArray(affair.out_dates) ? [...affair.out_dates] : [],
    back_dates: Array.isArray(affair.back_dates) ? [...affair.back_dates] : [],
    out_periods: affair.out_periods && typeof affair.out_periods === 'object' ? { ...affair.out_periods } : {},
    back_periods: affair.back_periods && typeof affair.back_periods === 'object' ? { ...affair.back_periods } : {},
    prep_days: affair.prep_days && typeof affair.prep_days === 'object' ? { ...affair.prep_days } : {},
    tech_name: affair.tech_name || '', tech_firstname: affair.tech_firstname || '',
    tech_email: affair.tech_email || '', tech_phone: affair.tech_phone || '',
    tech_name_monitor: affair.tech_name_monitor || '', tech_firstname_monitor: affair.tech_firstname_monitor || '',
    tech_email_monitor: affair.tech_email_monitor || '', tech_phone_monitor: affair.tech_phone_monitor || '',
    tech_name_system: affair.tech_name_system || '', tech_firstname_system: affair.tech_firstname_system || '',
    tech_email_system: affair.tech_email_system || '', tech_phone_system: affair.tech_phone_system || '',
    tech_name_stage: affair.tech_name_stage || '', tech_firstname_stage: affair.tech_firstname_stage || '',
    tech_email_stage: affair.tech_email_stage || '', tech_phone_stage: affair.tech_phone_stage || '',
    prep_date: affair.prep_date || '',
    receipt_date: affair.receipt_date || '',
    return_date: affair.return_date || '',
    front: affair.front || false,
    monitor: affair.monitor || false,
    system: affair.system || false,
    stage: affair.stage || false,
    description: affair.description || '',
    attachment_name: affair.attachment_name || '',
    attachment_url: affair.attachment_url || '',
  })
  existingAttachments.value = affair.attachment_name ? affair.attachment_name.split(',') : []
  attachmentFiles.value = []
  // Charger les messages
  const { data } = await supabase
    .from('message')
    .select('*')
    .eq('affairid', affair.affairid)
    .order('created_at', { ascending: true })
  affairMessages.value = data || []
}

async function sendMasterReply(affair) {
  if (!masterReply.value.trim()) return
  await supabase.from('message').insert({
    affairid: affair.affairid,
    sender_role: 'master',
    text: masterReply.value.trim(),
    read_by_tech: false,
    read_by_master: true,
  })
  masterReply.value = ''
  // Recharger messages
  const { data } = await supabase
    .from('message')
    .select('*')
    .eq('affairid', affair.affairid)
    .order('created_at', { ascending: true })
  affairMessages.value = data || []
}

async function markReadByMaster(affair) {
  await supabase
    .from('message')
    .update({ read_by_master: true })
    .eq('affairid', affair.affairid)
    .eq('sender_role', 'tech')
    .eq('read_by_master', false)
  delete unreadAffairs.value[affair.affairid]
  unreadAffairs.value = { ...unreadAffairs.value }
}

async function saveAffair() {
  console.log('saveAffair called', JSON.stringify(form))
  // Upload fichiers
  const uploadedNames = [...(existingAttachments.value || [])]
  const uploadedUrls = form.attachment_url ? form.attachment_url.split(',') : []
  for (const file of attachmentFiles.value) {
    const path = `affairs/${Date.now()}_${file.name}`
    const { error: upErr } = await supabase.storage.from('documents').upload(path, file)
    if (!upErr) {
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path)
      uploadedUrls.push(urlData?.publicUrl || '')
      uploadedNames.push(file.name)
    }
  }
  attachmentFiles.value = []
  form.attachment_name = uploadedNames.join(',')
  form.attachment_url = uploadedUrls.join(',')

  const payload = {
    name: form.name,
    tech_id: parseInt(localStorage.getItem('cablemaster-techid')) || 0,
    prep_date: form.prep_date || null,
    receipt_date: form.receipt_date || null,
    return_date: form.return_date || null,
    front: form.front,
    monitor: form.monitor,
    system: form.system,
    stage: form.stage,
    description: form.description || '',
    catalog_id: catalogId,
    // Tech façade
    tech_name: form.tech_name || '',
    tech_firstname: form.tech_firstname || '',
    tech_email: form.tech_email || '',
    tech_phone: form.tech_phone || '',
    // Tech retours
    tech_name_monitor: form.tech_name_monitor || '',
    tech_firstname_monitor: form.tech_firstname_monitor || '',
    tech_email_monitor: form.tech_email_monitor || '',
    tech_phone_monitor: form.tech_phone_monitor || '',
    // Tech système
    tech_name_system: form.tech_name_system || '',
    tech_firstname_system: form.tech_firstname_system || '',
    tech_email_system: form.tech_email_system || '',
    tech_phone_system: form.tech_phone_system || '',
    // Tech scène
    tech_name_stage: form.tech_name_stage || '',
    tech_firstname_stage: form.tech_firstname_stage || '',
    tech_email_stage: form.tech_email_stage || '',
    tech_phone_stage: form.tech_phone_stage || '',
    // Nouvelles colonnes
    reference: form.reference || '',
    event_type: form.event_type || '',
    venue: form.venue || '',
    nb_days: form.nb_days || null,
    tour_dates: form.tour_dates || [],
    out_dates: form.out_dates || [],
    back_dates: form.back_dates || [],
    out_periods: form.out_periods || {},
    back_periods: form.back_periods || {},
    prep_days: form.prep_days || {},
    attachment_name: form.attachment_name || '',
    attachment_url: form.attachment_url || '',
  }

  if (editing.value) {
    const { error } = await supabase.from('affair').update(payload).eq('affairid', editing.value.affairid)
    if (error) showMessage('Erreur: ' + error.message, 'error')
    else { showMessage('Affaire modifiée', 'success'); await loadAffairs(); showForm.value = false }
  } else {
    console.log('Inserting payload:', JSON.stringify(payload))
    const { data: insertData, error } = await supabase.from('affair').insert(payload)
    console.log('Insert result:', { data: insertData, error })
    if (error) { console.error('Insert error:', error); alert('Erreur: ' + error.message); showMessage('Erreur: ' + error.message, 'error') }
    else { showMessage('Affaire créée', 'success'); await loadAffairs(); showForm.value = false }
  }
}

async function sendInvitation() {
  if (!editing.value || !form.tech_email) return

  // Sauvegarder d'abord
  await saveAffair()

  const companyName = localStorage.getItem('cablemaster-company') || 'Notre entreprise'
  const techName = form.tech_name || 'Technicien'
  const affairName = form.name
  const dateStr = formatDate(form.receipt_date)
  const link = `${window.location.origin}/?affair=${editing.value.affairid}`

  const subject = encodeURIComponent(`Invitation : ${affairName} - ${dateStr}`)
  const body = encodeURIComponent(
`Bonjour ${techName},

Vous allez intervenir sur l'affaire "${affairName}" le ${dateStr}.

Merci de bien vouloir cliquer sur le lien ci-dessous pour nous informer de vos besoins en termes de micros et câblage :

${link}

Zones prévues : ${[form.front && 'Front', form.monitor && 'Monitor', form.stage && 'Stage'].filter(Boolean).join(', ') || 'Non définies'}

${form.description ? 'Notes : ' + form.description : ''}

Cordialement,
${companyName}`)

  // Ouvrir le client mail
  window.location.href = `mailto:${form.tech_email}?subject=${subject}&body=${body}`

  // Passer en statut envoyé
  await supabase.from('affair').update({ status: 'sent' }).eq('affairid', editing.value.affairid)
  showMessage(`Mail préparé pour ${form.tech_email}`, 'success')
  await loadAffairs()
  showForm.value = false
}

async function setStatus(status) {
  if (!editing.value) return
  await supabase.from('affair').update({ status }).eq('affairid', editing.value.affairid)
  showMessage(`Statut : ${statusLabel(status)}`, 'success')
  await loadAffairs()
  showForm.value = false
}

async function deleteAffairCard(affair) {
  if (!confirm(`Mettre l'affaire "${affair.name}" à la corbeille ?`)) return
  const { error } = await supabase.from('affair').update({ deleted_at: new Date().toISOString() }).eq('affairid', affair.affairid)
  if (error) { showMessage('Erreur: ' + error.message, 'error'); return }
  if (selected.value?.affairid === affair.affairid) { selected.value = null; showForm.value = false; editing.value = null }
  await loadAffairs()
  showMessage('Affaire mise à la corbeille', 'success')
}

async function deleteAffair() {
  if (!editing.value || !confirm('Mettre cette affaire à la corbeille ?')) return
  await supabase.from('affair').update({ deleted_at: new Date().toISOString() }).eq('affairid', editing.value.affairid)
  showMessage('Affaire supprimée', 'success')
  await loadAffairs()
  showForm.value = false
  editing.value = null
}

function openNewTech(zone) {
  newTechZone.value = newTechZone.value === zone ? '' : zone
  Object.assign(newTech, { firstname: '', name: '', email: '', phone: '' })
}

// Suffixe des champs technicien selon la zone : front → '', autres → '_<zone>'
function zoneSuffix(zone) { return zone === 'front' ? '' : `_${zone}` }

function onTechSelect(zone) {
  const s = zoneSuffix(zone)
  const email = form[`tech_email${s}`]
  const tech = technicians.value.find(t => t.email === email)
  if (!tech) return
  form[`tech_name${s}`] = tech.name || ''
  form[`tech_firstname${s}`] = tech.firstname || ''
  form[`tech_phone${s}`] = tech.phone || ''
}

async function addTechForZone(zone) {
  if (!newTech.name) return
  const { error } = await supabase.from('technician').insert({
    name: newTech.name,
    firstname: newTech.firstname,
    email: newTech.email,
    phone: newTech.phone,
    poste: zone,
    company_id: companyId,
  })
  if (!error) {
    await loadTechnicians()
    // Auto-sélectionner
    const s = zoneSuffix(zone)
    form[`tech_email${s}`] = newTech.email
    form[`tech_name${s}`] = newTech.name
    form[`tech_firstname${s}`] = newTech.firstname
    form[`tech_phone${s}`] = newTech.phone
    newTechZone.value = ''
    Object.assign(newTech, { firstname: '', name: '', email: '', phone: '' })
    showMessage('Technicien ajouté', 'success')
  }
}

function onFileSelect(e) {
  const files = Array.from(e.target.files || [])
  attachmentFiles.value = [...attachmentFiles.value, ...files]
}

function showMessage(msg, type) {
  message.value = msg
  messageType.value = type
  setTimeout(() => { message.value = '' }, 3000)
}
</script>

<style scoped>
.master-affaire {
  max-width: 500px;
  margin: 0 auto;
  padding: 10px;
  text-align: left;
}
h2 { text-align: center; font-size: 18px; margin-bottom: 12px; }
h3 { font-size: 16px; margin: 0; }
.affair-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
  justify-content: center;
}
.affair-tabs button {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--border-light, #ccc);
  border-radius: 6px;
  background: var(--bg-card, #f5f5f5);
  color: var(--text, #333);
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
}
.affair-tabs button.active {
  background: var(--color1);
  color: #fff;
  border-color: var(--color1);
}
.affair-list { margin-bottom: 10px; }
.affair-card {
  padding: 10px;
  border: 1px solid var(--border, #e0e0e0);
  border-radius: 8px;
  margin-bottom: 6px;
  cursor: pointer;
  background: var(--bg-card, #fafafa);
}
.affair-card.selected { border-color: var(--color1); }
.card-top { display: flex; align-items: center; gap: 6px; }
.card-status { font-size: 14px; }
.card-name { flex: 1; font-size: 15px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text, #333); }
.card-dates { display: flex; align-items: center; gap: 6px; margin-left: auto; flex-shrink: 0; }
.date-prep { font-size: 11px; color: var(--text-light, #888); }
.date-sep { width: 2px; height: 14px; background: #ef4444; border-radius: 1px; flex-shrink: 0; }
.date-event { font-size: 12px; font-weight: 700; color: var(--text, #333); }
.date-arrow { font-size: 11px; color: var(--text-muted, #999); }
.date-return { font-size: 11px; color: var(--text-light, #888); }
.btn-back { width: 100%; padding: 8px; background: transparent; border: 1px solid var(--border-light, #ccc); border-radius: 6px; color: var(--text, #333); font-size: 14px; font-weight: 600; cursor: pointer; margin-bottom: 8px; box-shadow: none; min-width: auto; text-align: left; }
.card-bottom { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-top: 4px; padding-left: 22px; }
.card-tech { font-size: 12px; color: var(--text-light, #888); }
.card-tags { display: flex; gap: 3px; }
.tag-sm { font-size: 9px; font-weight: 700; padding: 1px 4px; border-radius: 3px; color: #fff; }
.tag-sm.front { background: #3b82f6; }
.tag-sm.monitor { background: #f59e0b; }
.tag-sm.stage { background: #10b981; }
.btn-create-inline {
  width: 32px;
  height: 32px;
  background: var(--color3);
  color: #000;
  border: none;
  border-radius: 50%;
  font-size: 20px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  min-width: auto;
  box-shadow: none;
  flex-shrink: 0;
}
.btn-create-affair {
  width: 100%;
  padding: 14px;
  margin-bottom: 10px;
  background: var(--color1);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);
}
.btn-create-affair:active { transform: scale(0.98); }
.affair-card.trashed { opacity: 0.65; }
.btn-create {
  width: 100%;
  padding: 10px;
  background: var(--color3);
  color: #000;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 10px;
  box-shadow: none;
}
.form-panel input, .form-panel select, .form-panel textarea {
  background: var(--bg-input, #fff) !important;
  color: var(--text, #333) !important;
  -webkit-text-fill-color: var(--text, #333);
  opacity: 1;
}
.form-panel {
  background: var(--bg, #fff);
  border: 2px solid var(--color3);
  border-radius: 10px;
  padding: 14px;
  position: relative;
  z-index: 10;
}
.form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.close-btn { background: #ef4444; color: #fff; border: none; border-radius: 6px; padding: 4px 10px; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: none; min-width: auto; }
.form-row { margin-bottom: 10px; }
.form-row label { display: block; font-size: 12px; font-weight: 600; color: var(--text-light, #666); margin-bottom: 3px; }
.form-row input, .form-row select, .form-row textarea {
  width: 100%; padding: 8px 10px; border: 1px solid var(--border-light, #ccc);
  border-radius: 6px; font-size: 16px; outline: none;
  background: var(--bg-input, #fff); color: var(--text, #333);
  box-sizing: border-box;
}
.form-row input::placeholder, .form-row textarea::placeholder { color: var(--text-muted, #999); }
.form-row input:focus, .form-row select:focus, .form-row textarea:focus { border-color: var(--color1); }
.form-grid { display: flex; gap: 8px; }
.form-row.half { flex: 1; }
.btn-dates {
  width: 100%; padding: 10px; border: 2px dashed var(--color1); border-radius: 8px;
  background: var(--color1-light); color: var(--color1-dark); font-size: 14px; font-weight: 700;
  cursor: pointer; box-shadow: none;
}
.cal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000;
  display: flex; align-items: center; justify-content: center; padding: 10px;
}
.cal-modal {
  background: var(--bg, #fff); border-radius: 14px; padding: 12px;
  width: 100%; max-width: 380px; max-height: 80vh; display: flex; flex-direction: column;
}
.cal-modal-head { display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 700; margin-bottom: 8px; }
.type-picker { display: flex; gap: 6px; flex-wrap: wrap; }
.type-btn {
  padding: 7px 14px; border: 2px solid var(--border-light, #ccc); border-radius: 8px;
  background: var(--bg-input, #fff); color: var(--text, #333); font-size: 13px; font-weight: 600;
  cursor: pointer; box-shadow: none; min-width: auto;
}
.type-btn.active { border-color: var(--color1); background: var(--color1); color: #fff; }
.zone-toggles { display: flex; gap: 6px; }
.zone-toggles button {
  padding: 6px 14px; border: 2px solid var(--border-light, #ccc); border-radius: 6px;
  background: var(--bg-input, #fff); color: var(--text, #333);
  font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: none; min-width: auto;
}
.zone-toggles button.active.facade { border-color: #3b82f6; background: #3b82f6; color: #fff; }
.zone-toggles button.active.retour { border-color: #f59e0b; background: #f59e0b; color: #fff; }
.zone-toggles button.active.scene { border-color: #10b981; background: #10b981; color: #fff; }
.zone-toggles button.active.systeme { border-color: #8b5cf6; background: #8b5cf6; color: #fff; }
.zone-toggles button.active { border-color: var(--color1); background: var(--color1); color: #fff; }
.form-grid.three { display: flex; gap: 6px; flex-wrap: wrap; }
.form-grid.three .form-row { flex: 1 1 150px; min-width: 150px; }
.form-section-title { font-size: 13px; font-weight: 700; color: var(--text-light, #888); text-transform: uppercase; margin: 10px 0 6px; }
.zone-tech-block { margin: 6px 0; padding: 8px; border-radius: 8px; border: 1px solid var(--border-light, #eee); }
.zone-tech-block.facade { border-left: 3px solid #3b82f6; }
.zone-tech-block.retour { border-left: 3px solid #f59e0b; }
.zone-tech-block.systeme { border-left: 3px solid #8b5cf6; }
.zone-tech-block.scene { border-left: 3px solid #10b981; }
.zone-tech-header { font-size: 13px; font-weight: 700; margin-bottom: 6px; }
.zone-tech-select { display: flex; gap: 4px; align-items: center; }
.zone-tech-select select { flex: 1; padding: 6px; font-size: 14px; border: 1px solid var(--border-light, #ccc); border-radius: 6px; background: var(--bg-input, #fff); color: var(--text, #333); }
.btn-new-tech { width: 28px; height: 28px; border-radius: 50%; border: none; background: var(--color1); color: #fff; font-size: 16px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; min-width: auto; box-shadow: none; }
.new-tech-form { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; padding: 6px; border: 1px dashed var(--border-light, #ccc); border-radius: 6px; }
.new-tech-form input { flex: 1; min-width: 80px; padding: 6px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px; background: var(--bg-input, #fff); color: var(--text, #333); }
.new-tech-form button { padding: 6px 12px; background: var(--color1); color: #fff; border: none; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: none; min-width: auto; }
.zone-tech-info { font-size: 12px; color: var(--text-light, #888); margin-top: 4px; }
.zone-tech-info span { color: var(--text-muted, #999); }
.file-input { font-size: 14px; padding: 4px 0; color: var(--text, #333); }
.attachment-info { font-size: 12px; color: var(--color1); margin-top: 4px; }
.btn-add-tech {
  margin-top: 4px; padding: 4px 10px; font-size: 11px; font-weight: 600;
  border: 1px solid var(--color1); border-radius: 4px; background: transparent;
  color: var(--color1); cursor: pointer; box-shadow: none; min-width: auto;
}
.add-tech {
  display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; padding: 8px;
  border: 1px dashed var(--border-light, #ccc); border-radius: 6px;
}
.add-tech input { flex: 1; min-width: 100px; padding: 6px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px; background: var(--bg-input, #fff); color: var(--text, #333); }
.add-tech button { padding: 6px 12px; background: var(--color1); color: #fff; border: none; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: none; min-width: auto; }
.form-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
.btn-save { flex: 1; padding: 10px; background: var(--color1); color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 700; cursor: pointer; box-shadow: none; }
.btn-save:disabled { opacity: 0.4; }
.btn-draft { padding: 10px 14px; background: var(--bg-card, #eee); color: var(--text, #333); border: 1px solid var(--border-light, #ccc); border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: none; min-width: auto; }
.btn-send { padding: 10px 14px; background: #3b82f6; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: none; min-width: auto; }
.btn-delete { padding: 10px; background: #ef4444; color: #fff; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; box-shadow: none; min-width: auto; }
.card-techs { display: flex; flex-direction: column; gap: 3px; align-items: flex-start; }
.tech-zone-item { display: flex; align-items: center; gap: 5px; }
.zone-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.zone-dot.facade { background: #3b82f6; }
.zone-dot.retour { background: #f59e0b; }
.zone-dot.systeme { background: #8b5cf6; }
.zone-dot.scene { background: #10b981; }
.tech-firstname { font-size: 12px; color: var(--text, #333); font-weight: 600; }
.invite-btn { width: 22px; height: 22px; border-radius: 50%; border: none; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; min-width: auto; box-shadow: none; color: #fff; transition: all 0.15s; }
.invite-btn.facade { background: #3b82f6; }
.invite-btn.retour { background: #f59e0b; }
.invite-btn.scene { background: #10b981; }
.invite-btn.sent { background: #ccc; color: #666; }
.invite-btn:active { transform: scale(0.85); }
.card-action-btns { display: flex; gap: 4px; margin-left: auto; }
.card-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; margin-left: auto; text-align: right; }
.meta-type { font-size: 11px; font-weight: 800; color: #fff; background: var(--color1); border-radius: 10px; padding: 1px 8px; }
.meta-venue, .meta-days, .meta-dates { font-size: 11px; color: var(--text-light, #888); font-weight: 600; }
.action-tab-btn { width: 30px; height: 30px; border-radius: 6px; border: 1px solid var(--border-light, #ccc); background: var(--bg-card, #f5f5f5); font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; min-width: auto; box-shadow: none; position: relative; transition: all 0.15s; }
.action-tab-btn.active { background: var(--color1); border-color: var(--color1); }
.action-tab-btn:active { transform: scale(0.9); }
.action-tab-btn.danger { border-color: #ef4444; }
.action-tab-btn.danger:active { background: #fee2e2; }
.tab-dot { position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; border-radius: 50%; background: #ef4444; }
.fiche-description { font-size: 13px; color: var(--text, #333); padding: 6px 0; border-bottom: 1px solid var(--border-light, #eee); margin-bottom: 6px; }
.fiche-dates { font-size: 12px; color: var(--text-light, #888); }
.fiche-dates div { padding: 2px 0; }
.materiel-zone { margin-bottom: 10px; }
.materiel-zone-header { font-size: 14px; font-weight: 700; padding: 6px 8px; border-radius: 6px; margin-bottom: 4px; }
.materiel-zone-header.facade { background: rgba(59,130,246,0.15); color: #3b82f6; }
.materiel-zone-header.retour { background: rgba(245,158,11,0.15); color: #f59e0b; }
.materiel-zone-header.scene { background: rgba(16,185,129,0.15); color: #10b981; }
.materiel-zone-content { font-size: 13px; color: var(--text, #333); padding: 4px 8px; white-space: pre-wrap; }
.btn-print-materiel { width: 100%; padding: 8px; background: var(--color3); color: #000; border: none; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: none; min-width: auto; margin-top: 8px; }
.unread-star { color: #ef4444; font-size: 14px; animation: blink-star 1.5s infinite; }
@keyframes blink-star { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
.card-unread-msg { padding: 4px 8px 4px 22px; font-size: 12px; color: #ef4444; font-style: italic; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-expanded { padding: 8px; border-top: 1px solid var(--border-light, #eee); margin-top: 6px; }
.fiche-person { margin-bottom: 10px; border: 1px solid var(--border-light, #eee); border-radius: 8px; overflow: hidden; }
.fiche-person-header { padding: 6px 10px; font-size: 13px; font-weight: 700; }
.fiche-person-header.facade { background: rgba(59,130,246,0.1); color: #3b82f6; }
.fiche-person-header.retour { background: rgba(245,158,11,0.1); color: #f59e0b; }
.fiche-person-header.scene { background: rgba(16,185,129,0.1); color: #10b981; }
.fiche-person-body { padding: 8px 10px; }
.fiche-contact-all { display: block; text-align: center; padding: 8px; margin-bottom: 10px; background: var(--color1); color: #fff; border-radius: 8px; font-size: 14px; font-weight: 700; text-decoration: none; }
.fiche-person-line { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; margin-bottom: 6px; }
.fiche-person-name { font-size: 15px; font-weight: 700; color: var(--text, #333); }
.fiche-person-phone { font-size: 13px; color: var(--text-light, #888); }
.fiche-person-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.fiche-action-btn { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; cursor: pointer; }
.fiche-action-btn.call { background: rgba(59,130,246,0.1); color: #3b82f6; }
.fiche-action-btn.sms { background: rgba(16,185,129,0.1); color: #10b981; }
.fiche-action-btn.email { background: rgba(245,158,11,0.1); color: #f59e0b; }
.fiche-person-email { font-size: 12px; color: var(--text-light, #888); margin-bottom: 6px; }
.fiche-no-contact { font-size: 12px; color: var(--text-muted, #999); font-style: italic; margin-top: 4px; }
.master-chat { border: 1px solid var(--border-light, #eee); border-radius: 8px; padding: 8px; }
.chat-messages-master { max-height: 150px; overflow-y: auto; margin-bottom: 6px; }
.chat-msg-m { display: flex; gap: 6px; margin-bottom: 6px; }
.chat-msg-m.tech { flex-direction: row; }
.chat-msg-m.master { flex-direction: row-reverse; }
.msg-icon { font-size: 14px; flex-shrink: 0; }
.msg-content { background: var(--bg-card, #f0f0f0); padding: 4px 8px; border-radius: 8px; max-width: 80%; }
.chat-msg-m.master .msg-content { background: var(--color1-light); }
.msg-content p { margin: 0; font-size: 13px; color: var(--text, #333); }
.msg-time-m { font-size: 9px; color: var(--text-muted, #999); }
.chat-empty-m { text-align: center; color: var(--text-muted, #999); font-size: 11px; padding: 8px; }
.chat-input-m { display: flex; gap: 4px; margin-bottom: 6px; }
.chat-input-m input { flex: 1; padding: 6px 8px; border: 1px solid var(--border-light, #ccc); border-radius: 6px; font-size: 14px; background: var(--bg-input, #fff); color: var(--text, #333); outline: none; }
.chat-input-m button { padding: 6px 10px; background: var(--color1); color: #fff; border: none; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; box-shadow: none; min-width: auto; }
.chat-input-m button:disabled { opacity: 0.4; }
.btn-mark-read { width: 100%; padding: 6px; background: transparent; border: 1px solid #ef4444; color: #ef4444; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; box-shadow: none; min-width: auto; }
.empty { text-align: center; padding: 20px; color: var(--text-muted, #999); font-size: 14px; }
.message { text-align: center; padding: 10px; border-radius: 8px; margin-top: 10px; font-size: 14px; font-weight: 600; }
.message.success { background: var(--color1-light); color: var(--color1-dark); }
.message.error { background: #fecaca; color: #dc2626; }
.fc-loading { text-align: center; padding: 12px; color: var(--text-muted, #999); font-size: 13px; }
.zone-banner { padding: 6px 10px; font-size: 13px; font-weight: 700; border-radius: 6px; margin-bottom: 4px; }
.zone-banner.facade { background: rgba(59,130,246,0.1); color: #3b82f6; }
.zone-banner.retour { background: rgba(245,158,11,0.1); color: #f59e0b; }
.zone-banner.scene { background: rgba(16,185,129,0.1); color: #10b981; }
.zone-banner.systeme { background: rgba(139,92,246,0.12); color: #8b5cf6; }
.zone-block { margin-bottom: 12px; }
.zone-empty { padding: 8px 10px; font-size: 13px; color: var(--text-muted, #999); font-style: italic; }
/* Timeline */
.timeline-panel { background: var(--bg-card, #f9f9f9); border: 1px solid var(--border-light, #ddd); border-radius: 10px; padding: 8px; margin-bottom: 10px; }
.timeline-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.timeline-title { font-size: 14px; font-weight: 700; color: var(--text, #333); }
.timeline-scroll { overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; }
.timeline-grid { position: relative; padding-bottom: 10px; }
.timeline-months { display: flex; position: relative; height: 22px; border-bottom: 1px solid var(--border, #eee); }
.timeline-month { position: absolute; font-size: 10px; font-weight: 600; color: var(--text-light, #888); padding: 2px 4px; border-left: 1px solid var(--border, #eee); white-space: nowrap; }
.timeline-today { position: absolute; top: 0; bottom: 0; width: 2px; background: #ef4444; z-index: 2; opacity: 0.7; }
.timeline-bar { position: absolute; height: 24px; display: flex; align-items: center; border-radius: 4px; overflow: hidden; }
.bar-prep { height: 100%; background: rgba(245,158,11,0.3); border-radius: 4px 0 0 4px; flex-shrink: 0; }
.bar-event { height: 100%; background: var(--color1); opacity: 0.8; border-radius: 0 4px 4px 0; flex-shrink: 0; min-width: 8px; }
.bar-label { position: absolute; left: 4px; font-size: 10px; font-weight: 700; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: calc(100% - 8px); }
</style>
