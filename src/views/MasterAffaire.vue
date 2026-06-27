<template>
  <div class="master-affaire">
    <!-- Grand écran : visionneuse de documents/liens de l'affaire sélectionnée (colonne gauche) -->
    <DocViewer :affair="selected" />
    <div class="page-title-row">
      <button class="page-switch" :class="{ active: showGantt }" @click="showGantt = !showGantt">📊 Timeline</button>
      <button v-if="showGantt" class="page-switch tl-masquer" :class="{ active: showHiddenTl }" @click="showHiddenTl = !showHiddenTl">{{ showHiddenTl ? '👁 Masqués' : 'Masquer' }}</button>
    </div>

    <TimelineGantt v-if="showGantt" :selected-id="selected ? selected.affairid : null" :show-hidden="showHiddenTl" @select="onGanttSelect" />

    <!-- Liste des affaires avec statut -->
    <div v-if="!showForm" class="top-actions">
      <button class="btn-create-affair" @click="openNewAffair">＋ Nouvelle</button>
      <button class="filter-soon prep" :class="{ active: sortMode === 'prep' }" @click="toggleSort('prep')">Prépa</button>
      <button class="filter-soon out" :class="{ active: sortMode === 'out' }" @click="toggleSort('out')">Charg.</button>
      <button class="filter-soon back" :class="{ active: sortMode === 'back' }" @click="toggleSort('back')">Déch.</button>
      <button class="filter-soon msg-btn" :class="{ active: msgFilter, 'has-msg': unreadTotal > 0 }" @click="toggleMsgFilter" title="Messages reçus">
        <q-icon name="mail" size="20px" /><span v-if="unreadTotal" class="msg-badge">{{ unreadTotal }}</span>
      </button>
    </div>
    <div v-if="!showForm" class="time-filters">
      <button class="time-btn today" :class="{ active: timeFilter === 'd0' }" @click="toggleTime('d0')">Aujourd'hui</button>
      <button class="time-btn" :class="{ active: timeFilter === 'd1' }" @click="toggleTime('d1')">J+1</button>
      <button class="time-btn" :class="{ active: timeFilter === 'd2' }" @click="toggleTime('d2')">J+2</button>
      <button class="time-btn" :class="{ active: timeFilter === 'd3' }" @click="toggleTime('d3')">J+3</button>
      <button class="time-btn" :class="{ active: timeFilter === 'd4plus' }" @click="toggleTime('d4plus')">J++</button>
    </div>
    <div v-if="!showForm" class="affair-search-bar">
      <div class="affair-search-field">
        <input v-model="affairSearch" class="affair-search-input" :placeholder="searchPast ? '🔍 Rechercher dans le passé…' : '🔍 Rechercher une affaire à venir…'" />
        <button v-if="affairSearch" class="affair-search-clear" @click="affairSearch = ''" title="Effacer">✕</button>
      </div>
      <label class="affair-search-past"><input type="checkbox" v-model="searchPast" /> passé</label>
    </div>
    <div v-if="!showForm && managerFilter" class="manager-filter-chip">
      👤 Gérant : <strong>{{ managerFilter }}</strong>
      <button class="mfc-clear" @click="managerFilter = ''" title="Tout afficher">✕</button>
    </div>
    <div v-if="!showForm" class="affair-tabs">
      <button class="btn-mine" :class="{ active: mineOnly }" @click="mineOnly = !mineOnly" title="Afficher seulement mes affaires (gérant)">
        <span class="bm-main">Mes</span><span class="bm-sub">affaires</span>
      </button>
      <button class="star-btn" :class="{ active: followOnly }" @click="followOnly = !followOnly" title="À suivre (★)">★</button>
      <button :class="{ active: tab === 'new' }" @click="tab = tab === 'new' ? 'all' : 'new'">NEW</button>
      <button :class="{ active: tab === 'sent' }" @click="tab = tab === 'sent' ? 'all' : 'sent'">Envoyé</button>
      <select
        class="tab-select"
        :class="{ active: ['done', 'all', 'trash'].includes(tab) }"
        :value="['done', 'all', 'trash'].includes(tab) ? tab : ''"
        @change="tab = $event.target.value"
      >
        <option value="" disabled>Plus…</option>
        <option value="all">Tout</option>
        <option value="done">Terminé</option>
        <option value="trash">🗑 Poubelle</option>
      </select>
    </div>
    <button v-if="showForm" class="btn-back" @click="showForm = false">
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
    <div v-if="showForm" class="form-panel">
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
        <div class="form-row" style="flex: 1">
          <label>Ville</label>
          <input v-model="form.city" placeholder="ex: Paris" />
        </div>
        <div class="form-row" style="flex: 1">
          <label>Salle</label>
          <input v-model="form.venue" placeholder="ex: Zénith" />
        </div>
      </div>

      <div class="form-row">
        <button type="button" class="btn-dates" @click="calAffairId = null; showCalendar = true">
          📅 Dates de l'événement<span v-if="form.tour_dates.length"> ({{ form.tour_dates.length }})</span>
        </button>
      </div>

      <!-- Aperçu : mini-calendrier de tout l'événement (modif via le bouton « Dates » ci-dessus) -->
      <div v-if="miniCalAllDays(form)" class="mini-cal fiche-cal">
        <div v-for="d in miniCalAllDays(form)" :key="d.date" class="mini-cal-day">
          <span class="mcd-dow">{{ dowLetter(d.date) }}</span>
          <span class="mcd-num">{{ dayNum(d.date) }}</span>
          <span class="mcd-bars">
            <span v-for="(m, i) in d.marks" :key="i" class="mcd-mark" :title="EVENT_LABELS[m.type] + periodSuffix(m.period)">
              <span v-if="isArrowType(m.type)" class="mcd-arrow" :style="{ color: EVENT_COLORS[m.type] }">{{ arrowFor(m.type, m.period) }}</span>
              <span v-else class="mcd-bar" :style="{ background: EVENT_COLORS[m.type] }"></span>
            </span>
          </span>
        </div>
      </div>

      <div class="form-section-title">Postes</div>
      <div class="zone-toggles">
        <button :class="{ active: form.front }" @click="form.front = !form.front" class="zone-btn facade">Façade</button>
        <button :class="{ active: form.monitor }" @click="form.monitor = !form.monitor" class="zone-btn retour">Monitor</button>
        <button :class="{ active: form.system }" @click="form.system = !form.system" class="zone-btn systeme">Système</button>
        <button :class="{ active: form.stage }" @click="form.stage = !form.stage" class="zone-btn scene">Scène</button>
      </div>

      <div v-if="form.front" class="zone-tech-block facade">
        <div class="zone-tech-header">🔵 Façade</div>
        <div class="zone-tech-select">
          <select v-model="form.tech_email" @change="onTechSelect('front')">
            <option value="">-- Choisir --</option>
            <option v-for="o in techOptions('front')" :key="o.email" :value="o.email">{{ o.label }}</option>
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
        <div v-if="form.tech_name" class="zone-tech-info">{{ personName(form.tech_firstname, form.tech_name) }} <span v-if="form.tech_phone">· {{ form.tech_phone }}</span></div>
      </div>

      <div v-if="form.monitor" class="zone-tech-block retour">
        <div class="zone-tech-header">🟠 Monitor</div>
        <div class="zone-tech-select">
          <select v-model="form.tech_email_monitor" @change="onTechSelect('monitor')">
            <option value="">-- Choisir --</option>
            <option v-for="o in techOptions('monitor')" :key="o.email" :value="o.email">{{ o.label }}</option>
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
        <div v-if="form.tech_name_monitor" class="zone-tech-info">{{ personName(form.tech_firstname_monitor, form.tech_name_monitor) }} <span v-if="form.tech_phone_monitor">· {{ form.tech_phone_monitor }}</span></div>
      </div>

      <div v-if="form.system" class="zone-tech-block systeme">
        <div class="zone-tech-header">🟣 System</div>
        <div class="zone-tech-select">
          <select v-model="form.tech_email_system" @change="onTechSelect('system')">
            <option value="">-- Choisir --</option>
            <option v-for="o in techOptions('system')" :key="o.email" :value="o.email">{{ o.label }}</option>
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
        <div v-if="form.tech_name_system" class="zone-tech-info">{{ personName(form.tech_firstname_system, form.tech_name_system) }} <span v-if="form.tech_phone_system">· {{ form.tech_phone_system }}</span></div>
      </div>

      <div v-if="form.stage" class="zone-tech-block scene">
        <div class="zone-tech-header">🟢 Scène</div>
        <div class="zone-tech-select">
          <select v-model="form.tech_email_stage" @change="onTechSelect('stage')">
            <option value="">-- Choisir --</option>
            <option v-for="o in techOptions('stage')" :key="o.email" :value="o.email">{{ o.label }}</option>
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
        <div v-if="form.tech_name_stage" class="zone-tech-info">{{ personName(form.tech_firstname_stage, form.tech_name_stage) }} <span v-if="form.tech_phone_stage">· {{ form.tech_phone_stage }}</span></div>
      </div>

      <!-- Assistants (illimités, chacun avec son poste) -->
      <div class="assistants-block">
        <div class="zone-tech-header">🟦 Assistants</div>
        <div v-for="(a, i) in form.assistants" :key="i" class="assistant-row">
          <select v-model="a.area" class="assistant-area">
            <option value="front">Façade</option>
            <option value="monitor">Monitor</option>
            <option value="system">Système</option>
            <option value="stage">Scène</option>
          </select>
          <select v-model="a.email" class="assistant-tech" @change="onAssistantSelect(a)">
            <option value="">-- Choisir --</option>
            <option v-for="o in techOptions('assistant')" :key="o.email" :value="o.email">{{ o.label }}</option>
          </select>
          <button class="assistant-del" @click="form.assistants.splice(i, 1)" title="Retirer">✕</button>
        </div>
        <button class="btn-add-assistant" @click="addAssistant">+ Ajouter un assistant</button>
      </div>

      <div class="form-row">
        <label>Matériel / Notes</label>
        <textarea v-model="form.description" rows="5" placeholder="Systèmes K2, K3, wedge, subs, amplis..." ref="descriptionRef"></textarea>
      </div>

      <div class="form-row">
        <label>Documents joints</label>
        <input type="file" @change="onFileSelect" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" multiple class="file-input" />
        <button type="button" class="ze-doc-add" @click="addFormLink">+ Enregistrer un lien</button>
        <div v-for="(f, i) in attachmentFiles" :key="i" class="attachment-info">📎 {{ f.name }}</div>
        <div v-for="(name, i) in existingAttachments" :key="'ex'+i" class="attachment-info">🔗 {{ name }}</div>
      </div>

      <div class="form-actions">
        <button class="btn-save" @click="saveAffair" :disabled="!form.name">
          {{ editing ? '✓ Valider' : 'Créer' }}
        </button>
        <button v-if="editing" class="btn-draft" @click="setStatus('draft')">↩ NEW</button>
        <button v-if="editing" class="btn-delete" @click="deleteAffair">🗑 Supprimer</button>
      </div>
    </div>

    <!-- Liste -->
    <div class="affair-list" v-show="!showForm">
      <div
        v-for="affair in filteredAffairs"
        :key="affair.affairid"
        class="affair-card"
        :class="{ selected: selected?.affairid === affair.affairid, trashed: tab === 'trash' }"
        @click="onCardClick(affair)"
      >
        <!-- Actions fixes en haut à droite (fiche ouverte) -->
        <div v-if="selected?.affairid === affair.affairid && detailOpen" class="card-tr">
          <button class="card-edit-btn" @click.stop="editCurrentAffair" title="Modifier l'affaire">✏️</button>
          <button class="card-edit-btn" @click.stop="closeCard" title="Fermer la fiche">✕</button>
        </div>
        <div class="card-head" :class="{ 'has-actions': selected?.affairid === affair.affairid && detailOpen }">
          <span v-if="isNew(affair)" class="new-badge">NEW</span>
          <button v-if="isNew(affair)" class="send-badge-btn" @click.stop="sendAffair(affair)" title="Envoyer l'affaire">Envoyer</button>
          <span v-if="isSent(affair)" class="sent-badge" title="Affaire envoyée">Envoyé</span>
          <button class="follow-btn" :class="{ on: affair.followed }" @click.stop="toggleFollow(affair)" :title="affair.followed ? 'Suivi' : 'À suivre'">{{ affair.followed ? '★' : '☆' }}</button>
          <span v-if="unreadAffairs[affair.affairid]" class="unread-star" @click.stop="openChatOnly(affair)">★</span>
          <span class="card-name" :class="{ 'is-today': isTodayFor(affair), 'is-tomorrow': !isTodayFor(affair) && isTomorrowFor(affair) }">{{ affair.name || '(Sans nom)' }}</span>
          <!-- Carte sélectionnée → menu éditable ; sinon → filtre par gérant -->
          <select v-if="selected?.affairid === affair.affairid" class="manager-select" :value="affair.manager || ''" @click.stop @change="onManagerChange(affair, $event)" title="Qui gère cette affaire">
            <option value="">— gérant</option>
            <option v-for="m in managerOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>
          <button v-else class="manager-chip" :class="{ none: !affair.manager, active: managerFilter && managerFilter === affair.manager, 'mgr-gerant': managerRole(affair.manager) === 'gerant', 'mgr-principal': managerRole(affair.manager) === 'principal' }" @click.stop="clickManager(affair)" :title="affair.manager ? 'Voir les affaires gérées par ' + affair.manager : 'Aucun gérant'">
            {{ affair.manager || '— gérant' }}
          </button>
        </div>

        <div class="cdl-row">
          <div v-if="cardDateLine(affair).val" class="cdl-badge" :class="'cdl-' + cardDateLine(affair).type">
            <span class="cdl-label">{{ cardDateLine(affair).label }}</span>
            <span class="cdl-val">{{ cardDateLine(affair).val }}</span>
          </div>
          <button v-if="selected?.affairid === affair.affairid && detailOpen" class="card-cal-btn cdl-cal" @click.stop="openCalendarFor(affair)" title="Voir le calendrier">📅</button>
          <button class="card-chat-btn" :class="{ unread: !!unreadAffairs[affair.affairid] }" @click.stop="openChatModal(affair)" title="Chat">
            💬<span v-if="unreadAffairs[affair.affairid]" class="card-chat-badge">!</span>
          </button>
        </div>

        <!-- Mini-calendrier des jours-clés sous la date (jusqu'à 10 jours, sinon « … ») -->
        <div v-if="miniCalDays(affair)" class="mini-cal">
          <div v-for="d in miniCalDays(affair)" :key="d.date" class="mini-cal-day">
            <span class="mcd-dow">{{ dowLetter(d.date) }}</span>
            <span class="mcd-num">{{ dayNum(d.date) }}</span>
            <span class="mcd-bars">
              <span v-for="(m, i) in d.marks" :key="i" class="mcd-mark" :title="EVENT_LABELS[m.type] + periodSuffix(m.period)">
                <span v-if="isArrowType(m.type)" class="mcd-arrow" :style="{ color: EVENT_COLORS[m.type] }">{{ arrowFor(m.type, m.period) }}</span>
                <span v-else class="mcd-bar" :style="{ background: EVENT_COLORS[m.type] }"></span>
              </span>
            </span>
          </div>
          <div v-if="miniCalMore(affair)" class="mini-cal-more" title="… et d'autres dates ensuite">…</div>
        </div>

        <div class="card-bottom">
          <div class="card-techs">
            <div v-for="t in shownTechs(affair)" :key="t.cls" class="tech-zone-item">
              <span class="zone-dot" :class="[t.cls, { 'not-connected': !t.installed }]" :title="t.installed ? 'Connecté (app installée)' : 'Non connecté (pas d\'app)'"></span>
              <span class="tech-firstname" :class="{ clickable: t.email }" @click.stop="togglePersonAffairs(t.email)">{{ selected?.affairid === affair.affairid ? t.full : t.name }}</span>
            </div>
          </div>
          <div class="card-meta">
            <span v-if="affair.event_type" class="meta-type">{{ affair.event_type }}</span>
            <span v-if="affair.city" class="meta-venue">📍 {{ affair.city }}</span>
            <span v-if="affair.venue" class="meta-venue">🏛 {{ affair.venue }}</span>
          </div>
          <div v-if="tab === 'trash'" class="card-action-btns">
            <button class="action-tab-btn" @click.stop="restoreAffair(affair)" title="Restaurer">♻️</button>
            <button class="action-tab-btn danger" @click.stop="purgeAffair(affair)" title="Supprimer définitivement">⊗</button>
          </div>
        </div>

        <!-- Affaires de la personne cliquée (passé / à venir) -->
        <div v-if="expandedPerson && isOnAffair(affair, expandedPerson)" class="person-affairs" @click.stop>
          <div class="pa-col">
            <div class="pa-title">À venir</div>
            <button v-for="a in expandedPersonAffairs.future" :key="'f' + a.affairid" class="pa-link future" @click.stop="openAffairFromLink(a)">
              <span class="pa-name">{{ a.name || '(Sans nom)' }}</span><span class="pa-date">{{ affairLinkDate(a) }}</span>
            </button>
            <div v-if="!expandedPersonAffairs.future.length" class="pa-empty">—</div>
          </div>
          <div class="pa-col">
            <div class="pa-title">Passé</div>
            <button v-for="a in expandedPersonAffairs.past" :key="'p' + a.affairid" class="pa-link past" @click.stop="openAffairFromLink(a)">
              <span class="pa-name">{{ a.name || '(Sans nom)' }}</span><span class="pa-date">{{ affairLinkDate(a) }}</span>
            </button>
            <div v-if="!expandedPersonAffairs.past.length" class="pa-empty">—</div>
          </div>
        </div>
        <!-- Aperçu message non lu -->
        <div v-if="unreadAffairs[affair.affairid] && selected?.affairid !== affair.affairid" class="card-unread-msg">
          💬 {{ unreadAffairs[affair.affairid] }}
        </div>

        <!-- Panneau Fiche (détails) — au 2e clic -->
        <div v-if="selected?.affairid === affair.affairid && detailOpen" class="card-expanded" @click.stop>
          <!-- Contacter tous -->
          <a v-if="getAllEmails(affair).length > 0" :href="'mailto:' + getAllEmails(affair).join(',')" class="fiche-contact-all">📩 Contacter tous</a>

          <!-- Personnes par zone -->
          <div v-for="zone in getAffairZones(affair)" :key="zone.key" class="fiche-person">
            <div class="fiche-person-header" :class="zone.css">{{ zone.icon }} {{ zone.label }}</div>
            <div class="fiche-person-body">
              <div class="fiche-person-line">
                <span class="fiche-person-name">{{ personName(zone.firstname, zone.name) }}</span>
                <span v-if="isReachable(zone.email)" class="fiche-installed" title="A installé l'app — joignable par notification">📱</span>
                <span v-if="zone.phone" class="fiche-person-phone">{{ zone.phone }}</span>
                <span v-if="zone.email" class="fiche-person-email">{{ zone.email }}</span>
              </div>
              <div v-if="zone.phone || zone.email" class="fiche-person-actions">
                <button v-if="isReachable(zone.email)" class="fiche-action-btn notif" @click="notifyPerson(affair, zone)">🔔 Notifier</button>
                <a v-if="zone.phone" :href="'tel:' + zone.phone" class="fiche-action-btn call">📞 Appeler</a>
                <a v-if="zone.phone" :href="'sms:' + zone.phone" class="fiche-action-btn sms">💬 SMS</a>
                <a v-if="zone.email" :href="'mailto:' + zone.email" class="fiche-action-btn email">📩 Email</a>
              </div>
              <div v-if="!zone.phone && !zone.email" class="fiche-no-contact">Pas de coordonnées renseignées</div>
            </div>
          </div>
          <!-- Calendrier complet de l'événement (jours passés inclus) -->
          <div v-if="miniCalAllDays(affair)" class="mini-cal fiche-cal">
            <div v-for="d in miniCalAllDays(affair)" :key="d.date" class="mini-cal-day">
              <span class="mcd-dow">{{ dowLetter(d.date) }}</span>
              <span class="mcd-num">{{ dayNum(d.date) }}</span>
              <span class="mcd-bars">
                <span v-for="(m, i) in d.marks" :key="i" class="mcd-mark" :title="EVENT_LABELS[m.type] + periodSuffix(m.period)">
                  <span v-if="isArrowType(m.type)" class="mcd-arrow" :style="{ color: EVENT_COLORS[m.type] }">{{ arrowFor(m.type, m.period) }}</span>
                  <span v-else class="mcd-bar" :style="{ background: EVENT_COLORS[m.type] }"></span>
                </span>
              </span>
            </div>
          </div>
          <div v-if="affair.description" class="fiche-description">
            <strong>Notes :</strong> {{ affair.description }}
          </div>

          <!-- Documents joints (consulter / ajouter) -->
          <div class="ze-docs">
            <div class="ze-docs-title">📎 Documents</div>
            <a v-for="(d, i) in affairDocs(affair)" :key="'fd'+i" :href="d.url" target="_blank" class="ze-doc-link">📄 {{ d.name }}</a>
            <div class="ze-doc-row">
              <label class="ze-doc-add">+ Envoyer un document
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" @change="addDetailDoc(affair, $event)" hidden />
              </label>
              <button type="button" class="ze-doc-add" @click="addDetailLink(affair)">+ Enregistrer un lien</button>
            </div>
          </div>
        </div>

        <!-- Panneau Matériel (vue flight-cases) -->
        <div v-if="selected?.affairid === affair.affairid && expandedTab === 'materiel'" class="card-expanded" @click.stop>
          <div v-if="fcLoading" class="fc-loading">Chargement...</div>
          <template v-else>
            <!-- Front -->
            <div v-if="affair.front" class="zone-block">
              <div class="zone-banner facade">🔵 Façade — {{ affair.tech_name || '?' }}</div>
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
              <div class="zone-banner scene">🟢 Scène — {{ affair.tech_name_stage || '?' }}</div>
              <div class="zone-empty">Aucun matériel préparé</div>
            </div>
            <!-- Calculateur amplis -->
            <AmpCalculator :description="affair.description || ''" />
          </template>
        </div>
      </div>
      <div v-if="filteredAffairs.length === 0" class="empty">{{ tab === 'trash' ? 'Corbeille vide' : sortMode ? 'Rien à venir' : 'Aucune affaire' }}</div>
    </div>

    <!-- Chat plein écran -->
    <div v-if="chatModalOpen && chatModalAffair" class="chat-modal-overlay" @click.self="closeChatModal">
      <div class="chat-modal">
        <div class="chat-modal-head">
          <span class="chat-modal-title">💬 {{ chatModalAffair.name || 'Affaire' }}</span>
          <button class="chat-modal-close" @click="closeChatModal">✕</button>
        </div>
        <div class="chat-peers">
          <button class="chat-peer" :class="{ active: chatSel.length === 0 }" @click="selectPeer(chatModalAffair, '')">👥 Équipe</button>
          <button v-for="p in chatPeers(chatModalAffair)" :key="p.email" class="chat-peer" :class="{ active: chatSel.includes(p.email) }" @click="selectPeer(chatModalAffair, p.email)">
            <span class="chat-peer-check">{{ chatSel.includes(p.email) ? '☑' : '☐' }}</span> {{ p.name }}<span v-if="peerUnread(p.email)" class="chat-dot"></span>
          </button>
        </div>
        <div class="chat-modal-messages">
          <div v-for="msg in threadMessages" :key="msg.messageid" class="chat-msg-m" :class="msg.sender_role">
            <span class="msg-icon">{{ msg.sender_role === 'tech' ? '🧑‍🔧' : '🏢' }}</span>
            <div class="msg-content">
              <p>{{ msg.text }}</p>
              <span class="msg-time-m">{{ formatTime(msg.created_at) }}</span>
            </div>
          </div>
          <div v-if="threadMessages.length === 0" class="chat-empty-m">Aucun message</div>
        </div>
        <div class="chat-modal-input">
          <input v-model="masterReply" :placeholder="chatSel.length ? 'Message à ' + chatSel.length + ' personne' + (chatSel.length > 1 ? 's' : '') + '…' : 'Message à toute l\'équipe…'" @keydown.enter="sendChatModal" />
          <button @click="sendChatModal" :disabled="!masterReply.trim()">Envoyer</button>
        </div>
      </div>
    </div>

    <!-- Éditeur de zones (à l'envoi) : le master décrit chaque poste -->
    <div v-if="zoneEditor.open && zoneEditor.affair" class="zone-modal-overlay" @click.self="zoneEditor.open = false">
      <div class="zone-modal">
        <div class="zone-modal-head">
          <span class="zone-modal-title">Renseigner les zones — {{ zoneEditor.affair.name }}</span>
          <button class="zone-modal-close" @click="zoneEditor.open = false">✕</button>
        </div>
        <div class="zone-modal-body">
          <p class="zone-hint">Le technicien retrouvera ces infos pré-remplies en ouvrant son câblage. <b>*</b> = par côté (stéréo), sauf retours.</p>
          <div v-if="zoneEditor.affair.front" class="ze-block">
            <div class="ze-banner facade">🔵 Façade — {{ zoneEditor.affair.tech_name || '?' }}</div>
            <textarea v-model="zoneEditor.front" rows="5" :placeholder="ZONE_TPL.front"></textarea>
          </div>
          <div v-if="zoneEditor.affair.system" class="ze-block">
            <div class="ze-banner systeme">🟣 Système — {{ zoneEditor.affair.tech_name_system || '?' }}</div>
            <textarea v-model="zoneEditor.system" rows="5" :placeholder="ZONE_TPL.system"></textarea>
          </div>
          <div v-if="zoneEditor.affair.monitor" class="ze-block">
            <div class="ze-banner retour">🟠 Retours — {{ zoneEditor.affair.tech_name_monitor || '?' }}</div>
            <textarea v-model="zoneEditor.monitor" rows="4" :placeholder="ZONE_TPL.monitor"></textarea>
          </div>
          <div v-if="zoneEditor.affair.stage" class="ze-block">
            <div class="ze-banner scene">🟢 Scène — {{ zoneEditor.affair.tech_name_stage || '?' }}</div>
            <textarea v-model="zoneEditor.stage" rows="4" :placeholder="ZONE_TPL.stage"></textarea>
          </div>
          <div v-if="!zoneEditor.affair.front && !zoneEditor.affair.monitor && !zoneEditor.affair.system && !zoneEditor.affair.stage" class="zone-empty">
            Aucun poste défini sur cette affaire.
          </div>

          <!-- Documents joints -->
          <div class="ze-docs">
            <div class="ze-docs-title">📎 Documents (plan de scène, patch…)</div>
            <a v-for="(d, i) in zoneEditor.docNames" :key="'ed'+i" :href="zoneEditor.docUrls[i]" target="_blank" class="ze-doc-link">📄 {{ d }}</a>
            <div v-for="(f, i) in zoneEditor.newFiles" :key="'nf'+i" class="ze-doc-new">📎 {{ f.name }} <button class="ze-doc-x" @click="removeZoneNewFile(i)">✕</button></div>
            <div class="ze-doc-row">
              <label class="ze-doc-add">+ Ajouter un document
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" @change="onZoneFiles" hidden />
              </label>
              <button type="button" class="ze-doc-add" @click="addZoneLink">+ Enregistrer un lien</button>
            </div>
          </div>
        </div>
        <div class="ze-notify">
          <label class="ze-notify-toggle">
            <input type="checkbox" v-model="zoneEditor.notify" />
            🔔 Notifier les techniciens à l'envoi
          </label>
          <textarea v-if="zoneEditor.notify" v-model="zoneEditor.notifyMsg" rows="3" class="ze-notify-msg" placeholder="Message de la notification…"></textarea>
        </div>
        <div class="zone-modal-foot">
          <button class="ze-skip" @click="confirmSendAffair(false)">Enregistrer</button>
          <button class="ze-send" @click="confirmSendAffair(true)">Enregistrer &amp; Envoyer</button>
        </div>
      </div>
    </div>

    <!-- Calendrier (modal global) : édition depuis le formulaire, lecture seule depuis une carte -->
    <div v-if="showCalendar" class="cal-overlay" @click.self="cancelCalendar">
      <div class="cal-modal">
        <div class="cal-modal-head">
          <button class="cal-cancel" @click="cancelCalendar" title="Fermer sans enregistrer">✕</button>
          <span class="cal-modal-title">📅 {{ form.name || 'Événement' }} — {{ form.tour_dates.length }} date(s)</span>
          <button class="btn-valider" @click="closeCalendar">Valider</button>
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

    <!-- Message -->
    <div v-if="message" class="message" :class="messageType">{{ message }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import AllCasesView from '../components/AllCasesView.vue'
import DocViewer from '../components/DocViewer.vue'
import AmpCalculator from '../components/AmpCalculator.vue'
import TourCalendar from '../components/TourCalendar.vue'
import TimelineGantt from '../components/TimelineGantt.vue'

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
// Affaire éditée via le 📅 d'une carte (sauvegarde auto à la fermeture) ; null = mode formulaire
const calAffairId = ref(null)

function toggleTourDate(dateStr) {
  const arr = form.tour_dates.includes(dateStr)
    ? form.tour_dates.filter(d => d !== dateStr)
    : [...form.tour_dates, dateStr].sort()
  form.tour_dates = arr
  updateNbDays()
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

// Nb de jours = jours de PRÉSENCE des techniciens :
//  - si des jours de concert sont cochés → leur nombre
//  - sinon → les jours ENTRE chargement et déchargement (exclus). Ex. 17→20 = 2 (18,19)
function updateNbDays() {
  if (form.tour_dates && form.tour_dates.length) {
    form.nb_days = form.tour_dates.length
    return
  }
  const outs = (form.out_dates || []).filter(Boolean).sort()
  const backs = (form.back_dates || []).filter(Boolean).sort()
  if (outs.length && backs.length) {
    const d1 = new Date(outs[0] + 'T00:00:00')
    const d2 = new Date(backs[backs.length - 1] + 'T00:00:00')
    const diff = Math.round((d2 - d1) / 86400000)
    form.nb_days = Math.max(0, diff - 1)
  }
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
  city: '',
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
  assistants: [],
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
    name: '', reference: '', event_type: '', city: '', venue: '', nb_days: null, tour_dates: [], out_dates: [], back_dates: [], out_periods: {}, back_periods: {}, prep_days: {},
    tech_name: '', tech_firstname: '', tech_email: '', tech_phone: '',
    tech_name_monitor: '', tech_firstname_monitor: '', tech_email_monitor: '', tech_phone_monitor: '',
    tech_name_system: '', tech_firstname_system: '', tech_email_system: '', tech_phone_system: '',
    tech_name_stage: '', tech_firstname_stage: '', tech_email_stage: '', tech_phone_stage: '',
    assistants: [],
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

// Accès rapide au calendrier depuis une carte
// 📅 depuis une carte : charge les dates de l'affaire dans le calendrier (ÉDITABLE pour le master)
function openCalendarFor(affair) {
  form.name = affair.name || ''
  form.prep_date = affair.prep_date || ''
  form.receipt_date = affair.receipt_date || ''
  form.return_date = affair.return_date || ''
  form.nb_days = affair.nb_days ?? null
  form.tour_dates = Array.isArray(affair.tour_dates) ? [...affair.tour_dates] : []
  form.out_dates = Array.isArray(affair.out_dates) ? [...affair.out_dates] : []
  form.back_dates = Array.isArray(affair.back_dates) ? [...affair.back_dates] : []
  form.out_periods = affair.out_periods && typeof affair.out_periods === 'object' ? { ...affair.out_periods } : {}
  form.back_periods = affair.back_periods && typeof affair.back_periods === 'object' ? { ...affair.back_periods } : {}
  form.prep_days = affair.prep_days && typeof affair.prep_days === 'object' ? { ...affair.prep_days } : {}
  calAffairId.value = affair.affairid
  showCalendar.value = true
}

// Fermer SANS enregistrer (annule les modifs accidentelles)
function cancelCalendar() {
  calAffairId.value = null
  showCalendar.value = false
}

// Fermer le calendrier : si ouvert depuis une carte, on sauvegarde les dates dans l'affaire
async function closeCalendar() {
  if (calAffairId.value) {
    const payload = {
      tour_dates: form.tour_dates || [],
      out_dates: form.out_dates || [],
      back_dates: form.back_dates || [],
      out_periods: form.out_periods || {},
      back_periods: form.back_periods || {},
      prep_days: form.prep_days || {},
      prep_date: form.prep_date || null,
      receipt_date: form.receipt_date || null,
      return_date: form.return_date || null,
      nb_days: form.nb_days || null,
    }
    const { error } = await supabase.from('affair').update(payload).eq('affairid', calAffairId.value)
    if (error) showMessage('Erreur: ' + error.message, 'error')
    else { await loadAffairs(); showMessage('Calendrier enregistré', 'success') }
    calAffairId.value = null
  }
  showCalendar.value = false
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

const route = useRoute()
const router = useRouter()
const showGantt = ref(false)
const showHiddenTl = ref(false) // mode « Masqués » de la timeline (bouton à droite)
const detailOpen = ref(false)
function onGanttSelect(a) { selectAffair(a); detailOpen.value = true }
let unreadTimer = null
function onVisRefresh() { if (document.visibilityState === 'visible') refreshUnread() }
onMounted(async () => {
  await loadAffairs()
  loadTechnicians()
  refreshUnread()
  unreadTimer = setInterval(refreshUnread, 30000)
  document.addEventListener('visibilitychange', onVisRefresh)
  // Ouverture directe d'une affaire (depuis la Timeline : /MasterAffaire?affair=ID)
  const id = parseInt(route.query.affair)
  if (id) {
    const a = affairs.value.find(x => x.affairid === id)
    if (a) { selectAffair(a); detailOpen.value = true }
  }
  if (route.query.timeline) showGantt.value = true
})
onBeforeUnmount(() => {
  if (unreadTimer) clearInterval(unreadTimer)
  document.removeEventListener('visibilitychange', onVisRefresh)
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

// Rafraîchissement léger des non-lus (1 requête) — appelé au focus + périodiquement
async function refreshUnread() {
  const ids = affairs.value.map(a => a.affairid)
  if (!ids.length) { unreadAffairs.value = {}; return }
  const { data } = await supabase
    .from('message')
    .select('affairid, text, created_at')
    .eq('sender_role', 'tech')
    .eq('read_by_master', false)
    .in('affairid', ids)
    .order('created_at', { ascending: false })
  const unread = {}
  for (const m of (data || [])) {
    if (!unread[m.affairid]) unread[m.affairid] = m.text.substring(0, 60) + (m.text.length > 60 ? '...' : '')
  }
  unreadAffairs.value = unread
}

// Repli : si le master actif n'a pas d'entreprise attachée, prendre la 1ʳᵉ entreprise
const resolvedCompanyId = ref(companyId)
const companyResp = ref(null) // responsable principal (master principal)
async function loadTechnicians() {
  if (!resolvedCompanyId.value) {
    const { data: comps } = await supabase.from('company').select('companyid').order('companyid').limit(1)
    if (comps?.[0]) resolvedCompanyId.value = comps[0].companyid
  }
  if (!resolvedCompanyId.value) return
  const { data } = await supabase.from('technician').select('*').eq('company_id', resolvedCompanyId.value).order('name')
  technicians.value = data || []
  const { data: comp } = await supabase.from('company').select('resp_firstname, resp_lastname, resp_nickname, master_techid').eq('companyid', resolvedCompanyId.value).single()
  companyResp.value = comp || null
}

// Masters pouvant gérer une affaire : gérant (responsable) + master principal + secondaires.
// Affiché par surnom (diminutif) si présent, sinon prénom.
const managerOptions = computed(() => {
  const r = companyResp.value
  const out = []
  if (r && (r.resp_nickname || r.resp_firstname)) {
    const v = r.resp_nickname || r.resp_firstname
    out.push({ value: v, label: `🧭 ${v} · gérant`, role: 'gerant' })
  }
  const principalId = r?.master_techid
  for (const t of (technicians.value || [])) {
    if (!t.can_manage_affairs) continue
    const v = t.nickname || t.firstname || t.name
    if (!v) continue
    if (principalId && t.techid === principalId) out.push({ value: v, label: `👑 ${v} · master`, role: 'principal' })
    else out.push({ value: v, label: v, role: 'secondary' })
  }
  const seen = new Set()
  return out.filter(o => !seen.has(o.value) && seen.add(o.value))
})
// Rôle d'un nom de gérant (pour colorer la puce sur les cartes)
function managerRole(name) {
  if (!name) return ''
  const o = managerOptions.value.find(x => x.value === name)
  return o ? o.role : ''
}
async function onManagerChange(affair, ev) {
  const v = ev.target.value || null
  affair.manager = v
  await supabase.from('affair').update({ manager: v }).eq('affairid', affair.affairid)
}
// « Mes affaires » : affaires dont je suis le gérant
const mineOnly = ref(false)
// Toutes les étiquettes possibles de mon identité de gérant (surnom, prénom, nom)
const myManagerKeys = computed(() => {
  const techId = parseInt(localStorage.getItem('cablemaster-techid')) || 0
  const keys = []
  const t = (technicians.value || []).find(x => x.techid === techId)
  if (t) keys.push(t.nickname, t.firstname, t.name)
  const r = companyResp.value
  if (r) keys.push(r.resp_nickname, r.resp_firstname, `${r.resp_firstname || ''} ${r.resp_lastname || ''}`.trim())
  return keys.filter(Boolean).map(s => s.trim().toLowerCase())
})
function isMyAffair(a) {
  return !!a.manager && myManagerKeys.value.includes(a.manager.trim().toLowerCase())
}
// Filtre par gérant : clic sur le nom (carte non sélectionnée) → toutes ses affaires
const managerFilter = ref('')
function clickManager(affair) {
  if (!affair.manager) return
  managerFilter.value = managerFilter.value === affair.manager ? '' : affair.manager
}

const trashedAffairs = ref([])
async function loadTrashed() {
  let query = supabase.from('affair').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
  if (catalogId) query = query.eq('catalog_id', catalogId)
  const { data } = await query
  trashedAffairs.value = data || []
}

// Filtre "à venir" : Prépa / Chargement / Déchargement
const sortMode = ref('')
const timeFilter = ref('') // '' | 'd0' | 'd1' | 'd2' | 'd3' | 'd4plus'
const followOnly = ref(false) // n'afficher que les affaires "à suivre" (★)
// Messages : enveloppe en haut → nb d'affaires avec messages non lus + filtre
const msgFilter = ref(false)
const unreadTotal = computed(() => Object.keys(unreadAffairs.value || {}).length)
function toggleMsgFilter() {
  msgFilter.value = !msgFilter.value
  if (msgFilter.value) {
    // Montrer toutes les affaires avec messages, sans filtre de phase/temps qui masquerait
    tab.value = 'all'; timeFilter.value = ''; sortMode.value = ''
    followOnly.value = false; mineOnly.value = false; managerFilter.value = ''
    refreshUnread()
  }
}
const affairSearch = ref('') // moteur de recherche d'affaires
const searchPast = ref(false) // false = affaires à venir ; true = affaires passées/terminées
function toggleSort(mode) {
  sortMode.value = sortMode.value === mode ? '' : mode
  timeFilter.value = ''
}
function toggleTime(mode) {
  timeFilter.value = timeFilter.value === mode ? '' : mode
  sortMode.value = ''
}
function isoFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function tomorrowISO() {
  const d = new Date(); d.setDate(d.getDate() + 1); return isoFromDate(d)
}
function plusDaysISO(n) {
  const d = new Date(); d.setDate(d.getDate() + n); return isoFromDate(d)
}
// Une date est-elle dans la fenêtre temporelle choisie ?
// 'd0'=aujourd'hui, 'd1'..'d3'=J+1..J+3 (jour exact), 'd4plus'=J+4 et au-delà
function inWindow(d) {
  switch (timeFilter.value) {
    case 'd0': return d === plusDaysISO(0)
    case 'd1': return d === plusDaysISO(1)
    case 'd2': return d === plusDaysISO(2)
    case 'd3': return d === plusDaysISO(3)
    case 'd4plus': return d >= plusDaysISO(4)
    default: return false
  }
}
// Toutes les dates de l'affaire (prépa + chargement + déchargement) avec leur type
function allEvents(a) {
  const ev = []
  const pk = Object.keys(a.prep_days || {})
  if (pk.length) pk.forEach(d => ev.push({ type: 'prep', date: d }))
  else if (a.prep_date) ev.push({ type: 'prep', date: a.prep_date })
  const out = a.out_dates || []
  if (out.length) out.forEach(d => ev.push({ type: 'out', date: d }))
  else if (a.receipt_date) ev.push({ type: 'out', date: a.receipt_date })
  const back = a.back_dates || []
  if (back.length) back.forEach(d => ev.push({ type: 'back', date: d }))
  else if (a.return_date) ev.push({ type: 'back', date: a.return_date })
  return ev
}
function windowEvent(a) {
  return allEvents(a).filter(e => inWindow(e.date)).sort((x, y) => (x.date < y.date ? -1 : 1))[0] || null
}
// Ordre des phases pour un même jour : prépa → chargement → déchargement
const PHASE_ORDER = { prep: 0, out: 1, back: 2 }
function cmpEvents(x, y) {
  if (x.date !== y.date) return x.date < y.date ? -1 : 1
  return (PHASE_ORDER[x.type] ?? 9) - (PHASE_ORDER[y.type] ?? 9)
}
// Prochain événement à venir (sinon le plus récent passé) — tous types confondus
function nextEvent(a) {
  const evs = allEvents(a).filter(e => e.date)
  if (!evs.length) return null
  const today = todayISO()
  const upcoming = evs.filter(e => e.date >= today)
  return (upcoming.length ? upcoming : evs).slice().sort(cmpEvents)[0]
}
function eventMoment(a, ev) {
  if (ev.type === 'prep') return prepMoment((a.prep_days || {})[ev.date])
  const per = (ev.type === 'out' ? a.out_periods : a.back_periods) || {}
  return periodTag(per[ev.date])
}
// Dates pertinentes de l'affaire selon le filtre actif (Prépa par défaut)
function relevantDates(a) {
  const mode = sortMode.value || 'prep'
  if (mode === 'out') return (a.out_dates && a.out_dates.length) ? a.out_dates : (a.receipt_date ? [a.receipt_date] : [])
  if (mode === 'back') return (a.back_dates && a.back_dates.length) ? a.back_dates : (a.return_date ? [a.return_date] : [])
  const k = Object.keys(a.prep_days || {})
  return k.length ? k : (a.prep_date ? [a.prep_date] : [])
}
// Aujourd'hui → jaune ; demain → ambre. En vue temporelle : tous types confondus
function datesForHighlight(a) {
  if (timeFilter.value) return allEvents(a).map(e => e.date)
  if (!sortMode.value) { const e = nextEvent(a); return e ? [e.date] : [] }
  return relevantDates(a)
}
// Emails des techniciens installés (joignables par l'app) → pastille carrée
const installedEmails = computed(() => {
  const s = new Set()
  ;(technicians.value || []).forEach(t => { if (t.installed && t.email) s.add(t.email.toLowerCase()) })
  return s
})
function isReachable(email) { return !!email && installedEmails.value.has(email.toLowerCase()) }

// Mini-calendrier d'aperçu : jours-clés si l'affaire tient sur ≤ 1 semaine
const EVENT_COLORS = { prep: '#ea580c', out: '#3b82f6', show: '#22c55e', back: '#15803d' }
const EVENT_LABELS = { prep: 'Prépa', out: 'Chargement', show: 'Concert', back: 'Déchargement' }
// Flèche diagonale selon le moment : matin = vers le haut (↗/↖), après-midi = vers le bas (↘/↙)
function arrowFor(type, period) {
  // matin = vers le bas (↘/↙) ; après-midi = vers le haut (↗/↖)
  if (type === 'out') return period === 'am' ? '↘' : period === 'pm' ? '↗' : '→'
  if (type === 'back') return period === 'am' ? '↙' : period === 'pm' ? '↖' : '←'
  return ''
}
function isArrowType(t) { return t === 'out' || t === 'back' }
function periodSuffix(p) { return p === 'am' ? ' (matin ↓)' : p === 'pm' ? ' (après-midi ↑)' : '' }
function dowLetter(d) { return ['D', 'L', 'M', 'M', 'J', 'V', 'S'][new Date(d + 'T00:00:00').getDay()] }
function dayNum(d) { return parseInt(d.slice(8, 10), 10) }
// Tous les jours-clés (prépa / chargement / concert / déchargement), triés
function miniCalFull(a) {
  const map = {} // date -> [{ type, period }]
  const add = (d, t, period) => {
    if (!d) return
    map[d] = map[d] || []
    if (!map[d].some(m => m.type === t)) map[d].push({ type: t, period: period || null })
  }
  const pk = Object.keys(a.prep_days || {})
  if (pk.length) pk.forEach(d => add(d, 'prep')); else add(a.prep_date, 'prep')
  const out = a.out_dates || [], op = a.out_periods || {}
  if (out.length) out.forEach(d => add(d, 'out', op[d])); else add(a.receipt_date, 'out')
  ;(a.tour_dates || []).forEach(d => add(d, 'show'))
  const back = a.back_dates || [], bp = a.back_periods || {}
  if (back.length) back.forEach(d => add(d, 'back', bp[d])); else add(a.return_date, 'back')
  const days = Object.keys(map).filter(Boolean).sort()
  return days.map(d => ({ date: d, marks: map[d] }))
}
const MINI_CAL_MAX = 5 // au-delà : on montre 5 jours (les prochains) + « … »
// Jours à afficher : uniquement aujourd'hui et à venir (les dates passées ne nous intéressent plus)
function miniCalBase(a) {
  const all = miniCalFull(a)
  if (!all.length) return []
  const today = todayISO()
  const upcoming = all.filter(x => x.date >= today)
  return upcoming.length ? upcoming : all // tout passé (ex. affaire échue) → repli sur tout
}
function miniCalDays(a) {
  const base = miniCalBase(a)
  return base.length ? base.slice(0, MINI_CAL_MAX) : null
}
// Y a-t-il plus de jours (à venir) que ce qu'on affiche (→ ajouter « … ») ?
function miniCalMore(a) { return miniCalBase(a).length > MINI_CAL_MAX }
// Fiche détail : on montre TOUT l'événement (jours passés inclus), pas seulement à venir
function miniCalAllDays(a) {
  const all = miniCalFull(a)
  return all.length ? all : null
}
// Techniciens d'une affaire (tous les postes actifs)
function allTechs(a) {
  const all = []
  if (a.front) all.push({ cls: 'facade', name: a.tech_firstname || a.tech_name || '?', full: personName(a.tech_firstname, a.tech_name), email: a.tech_email || '', installed: isReachable(a.tech_email) })
  if (a.monitor) all.push({ cls: 'retour', name: a.tech_firstname_monitor || a.tech_name_monitor || '?', full: personName(a.tech_firstname_monitor, a.tech_name_monitor), email: a.tech_email_monitor || '', installed: isReachable(a.tech_email_monitor) })
  if (a.system) all.push({ cls: 'systeme', name: a.tech_firstname_system || a.tech_name_system || '?', full: personName(a.tech_firstname_system, a.tech_name_system), email: a.tech_email_system || '', installed: isReachable(a.tech_email_system) })
  if (a.stage) all.push({ cls: 'scene', name: a.tech_firstname_stage || a.tech_name_stage || '?', full: personName(a.tech_firstname_stage, a.tech_name_stage), email: a.tech_email_stage || '', installed: isReachable(a.tech_email_stage) })
  return all
}
function topTechs(a) { return allTechs(a).slice(0, 2) }
// Carte compacte → 2 techs ; carte sélectionnée (1er clic) → tous les techs
function shownTechs(a) {
  return selected.value?.affairid === a.affairid ? allTechs(a) : topTechs(a)
}
function isTodayFor(a) { return datesForHighlight(a).includes(todayISO()) }
function isTomorrowFor(a) { return datesForHighlight(a).includes(tomorrowISO()) }

// Résumés COMPACTS pour la carte : 1 jour → date + moment ; plusieurs jours → « … »
function prepMoment(v) { return v === 'full' ? ' journée entière' : v === 'bottom' ? ' matin' : ' après-midi' }
// La date "montrée" = la prochaine à venir (≥ aujourd'hui), sinon la dernière passée
function nextShown(arr) {
  const t = todayISO()
  return arr.find(d => d >= t) || arr[arr.length - 1]
}
function compactPrep(a) {
  const map = a.prep_days && typeof a.prep_days === 'object' ? a.prep_days : {}
  const keys = Object.keys(map).sort()
  if (!keys.length) return a.prep_date ? shortDate(a.prep_date) : ''
  const shown = nextShown(keys)
  const v = map[shown]
  const moreAfter = keys.some(d => d > shown)
  // demi-journée seule → on affiche le moment ; journée entière ou d'autres jours → …
  if (v !== 'full' && !moreAfter) return shortDate(shown) + prepMoment(v)
  return shortDate(shown) + ' …'
}
function compactList(arr0, periods, fallback) {
  const arr = (arr0 && arr0.length) ? [...arr0].sort() : (fallback ? [fallback] : [])
  if (!arr.length) return ''
  const shown = nextShown(arr)
  const base = shortDate(shown) + periodTag((periods || {})[shown])
  return arr.some(d => d > shown) ? base + ' …' : base
}

// Ligne de date affichée sur la carte selon le filtre actif (Prépa par défaut)
const TYPE_LABELS = { prep: 'Prépa', out: 'Chargement', back: 'Déchargement' }
function cardDateLine(a) {
  // Vue temporelle (fenêtre) ou flux chronologique par défaut → événement pertinent
  if (timeFilter.value || !sortMode.value) {
    const ev = timeFilter.value ? windowEvent(a) : nextEvent(a)
    if (!ev) return { label: '', val: '', type: 'prep' }
    return { label: TYPE_LABELS[ev.type], val: shortDate(ev.date) + eventMoment(a, ev), type: ev.type }
  }
  if (sortMode.value === 'out') return { label: 'Chargement', val: compactList(a.out_dates, a.out_periods, a.receipt_date), type: 'out' }
  if (sortMode.value === 'back') return { label: 'Déchargement', val: compactList(a.back_dates, a.back_periods, a.return_date), type: 'back' }
  return { label: 'Prépa', val: compactPrep(a), type: 'prep' }
}
function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
// Date "clé" de l'affaire pour le mode : la plus proche À VENIR (sinon null)
function keyDate(a, mode) {
  let dates = []
  if (mode === 'prep') dates = Object.keys(a.prep_days || {})
  else if (mode === 'out') dates = [...(a.out_dates || [])]
  else if (mode === 'back') dates = [...(a.back_dates || [])]
  if (!dates.length) {
    const fb = mode === 'prep' ? a.prep_date : mode === 'out' ? a.receipt_date : a.return_date
    if (fb) dates = [fb]
  }
  const today = todayISO()
  const upcoming = dates.filter(Boolean).filter(d => d >= today).sort()
  return upcoming[0] || null
}

// Dernière date de déchargement (phase ultime) d'une affaire
function lastBackDate(a) {
  const arr = (Array.isArray(a.back_dates) && a.back_dates.length) ? a.back_dates : (a.return_date ? [a.return_date] : [])
  const valid = arr.filter(Boolean).slice().sort()
  return valid.length ? valid[valid.length - 1] : null
}
// Au moins un poste pourvu (ou un assistant) → l'affaire est prise en main
function staffed(a) {
  if (a.front && (a.tech_firstname || a.tech_name)) return true
  if (a.monitor && (a.tech_firstname_monitor || a.tech_name_monitor)) return true
  if (a.system && (a.tech_firstname_system || a.tech_name_system)) return true
  if (a.stage && (a.tech_firstname_stage || a.tech_name_stage)) return true
  if (Array.isArray(a.assistants) && a.assistants.length) return true
  return false
}
// Badge "NEW" : affaire pas encore envoyée (statut brouillon) et non terminée.
// Reste NEW tant qu'on n'a pas cliqué « Envoyer ».
function isNew(a) {
  if (isFinished(a)) return false
  return (a.status || 'draft') === 'draft'
}
// Affaire déjà envoyée (et pas terminée) → badge « Envoyé »
function isSent(a) {
  if (isFinished(a)) return false
  return (a.status || 'draft') === 'sent'
}
async function toggleFollow(a) {
  const v = !a.followed
  a.followed = v
  const { error } = await supabase.from('affair').update({ followed: v }).eq('affairid', a.affairid)
  if (error) { a.followed = !v; showMessage('Erreur: ' + error.message, 'error') }
}
// Modèles guidés par poste (placeholders). * = par côté (stéréo) — sauf retours.
const ZONE_TPL = {
  front: 'PA : 12 K2*\nSubs : 4 KS28*\nFrontfills : 2 X12*\nDélai : 2, 4, 3\nAmplis (racks) : Rack 1 …, Rack 2 …\n(* = par côté / stéréo)',
  system: 'PA : …\nSubs : …\nDélai : …\nAmplis (racks) : Rack 1 …, Rack 2 …\n(* = par côté / stéréo)',
  monitor: 'Nb circuits : …\nRetours : 8 X12, 8 X15…\nSides : oui / non\nDrumfill : oui / non\nType d\'amplis : …\n(pas d\'astérisque ici)',
  stage: 'Nb groupes : …\nPatches / groupe : … → patch 24/32/48\nPlan de scène : (joint ?)\nPieds de micro : …\nBase micro : voir technicien façade',
}
const zoneEditor = reactive({ open: false, affair: null, front: '', monitor: '', system: '', stage: '', docNames: [], docUrls: [], newFiles: [], notify: true, notifyMsg: '' })

// Clic « Envoyer » → ouvre l'éditeur de zones (le master renseigne chaque poste avant d'envoyer)
function sendAffair(a) {
  zoneEditor.affair = a
  zoneEditor.front = a.materiel_front || ''
  zoneEditor.monitor = a.materiel_monitor || ''
  zoneEditor.system = a.materiel_system || ''
  zoneEditor.stage = a.materiel_stage || ''
  zoneEditor.docNames = a.attachment_name ? a.attachment_name.split(',').filter(Boolean) : []
  zoneEditor.docUrls = a.attachment_url ? a.attachment_url.split(',') : []
  zoneEditor.newFiles = []
  const d = a.receipt_date || (Array.isArray(a.out_dates) && a.out_dates[0]) || a.prep_date || ''
  zoneEditor.notify = true
  zoneEditor.notifyMsg = `Salut ! Tu as accès aux infos pour « ${a.name || 'l\'affaire'} »${d ? ' (' + shortDate(d) + ')' : ''}. Ouvre Cinod-Prep pour faire ta liste de câblage.`
  zoneEditor.open = true
}
function onZoneFiles(e) {
  zoneEditor.newFiles = [...zoneEditor.newFiles, ...Array.from(e.target.files || [])]
  e.target.value = ''
}
function removeZoneNewFile(i) { zoneEditor.newFiles.splice(i, 1) }
// Demande un lien (URL + nom) ; renvoie { name, url } ou null
function promptLink() {
  const url = (prompt('Lien (URL) — ex. plan de scène :') || '').trim()
  if (!url) return null
  const name = ((prompt('Nom du lien (optionnel) :') || '').trim() || url).replace(/,/g, ' ')
  return { name, url }
}
function addZoneLink() {
  const l = promptLink()
  if (!l) return
  zoneEditor.docNames.push(l.name)
  zoneEditor.docUrls.push(l.url)
}

// Upload d'une liste de fichiers vers le bucket documents → renvoie {names, urls}
async function uploadDocuments(files, names = [], urls = []) {
  const outNames = [...names], outUrls = [...urls]
  for (const file of files) {
    const path = `affairs/${Date.now()}_${file.name}`
    const { error: upErr } = await supabase.storage.from('documents').upload(path, file)
    if (!upErr) {
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path)
      outUrls.push(urlData?.publicUrl || '')
      outNames.push(file.name)
    }
  }
  return { names: outNames, urls: outUrls }
}

// Enregistre toujours les zones + documents ; envoie (status sent + suivi) seulement si demandé.
// « Enregistrer » seul : l'affaire reste NEW (bouton Envoyer encore présent) → on peut compléter plus tard.
async function confirmSendAffair(send = false) {
  const a = zoneEditor.affair
  if (!a) return
  const patch = {
    materiel_front: zoneEditor.front || null,
    materiel_monitor: zoneEditor.monitor || null,
    materiel_system: zoneEditor.system || null,
    materiel_stage: zoneEditor.stage || null,
  }
  const { names, urls } = await uploadDocuments(zoneEditor.newFiles, zoneEditor.docNames, zoneEditor.docUrls)
  patch.attachment_name = names.join(',')
  patch.attachment_url = urls.join(',')
  zoneEditor.docNames = names
  zoneEditor.docUrls = urls
  zoneEditor.newFiles = []
  if (send) { patch.status = 'sent'; patch.followed = true }
  Object.assign(a, patch)
  const { error } = await supabase.from('affair').update(patch).eq('affairid', a.affairid)
  if (error) { showMessage('Erreur: ' + error.message, 'error'); return }

  // À l'envoi : notification push + trace chat aux techniciens assignés
  let pushInfo = ''
  if (send && zoneEditor.notify) {
    const peers = chatPeers(a)
    const msg = (zoneEditor.notifyMsg || '').trim()
    if (peers.length && msg) {
      try {
        await supabase.from('message').insert(peers.map(p => ({
          affairid: a.affairid, sender_role: 'master', text: msg,
          peer_email: p.email, read_by_master: true, read_by_tech: false,
        })))
        const { data } = await supabase.functions.invoke('send-push', {
          body: { emails: peers.map(p => p.email), title: a.name || 'Cinod-Prep', body: msg, url: '/?affair=' + a.affairid },
        })
        pushInfo = ` — notifié (${data?.sent || 0} appareil·s)`
      } catch (e) { pushInfo = ' — notif non envoyée' }
    }
  }
  zoneEditor.open = false
  showMessage(send ? 'Affaire envoyée' + pushInfo : 'Zones enregistrées', 'success')
}

// Fiche détail : ajouter un document à la volée
async function addDetailDoc(a, e) {
  const files = Array.from(e.target.files || [])
  e.target.value = ''
  if (!files.length) return
  const names = a.attachment_name ? a.attachment_name.split(',').filter(Boolean) : []
  const urls = a.attachment_url ? a.attachment_url.split(',') : []
  const res = await uploadDocuments(files, names, urls)
  a.attachment_name = res.names.join(',')
  a.attachment_url = res.urls.join(',')
  await supabase.from('affair').update({ attachment_name: a.attachment_name, attachment_url: a.attachment_url }).eq('affairid', a.affairid)
  showMessage('Document ajouté', 'success')
}
function affairDocs(a) {
  const names = a.attachment_name ? a.attachment_name.split(',').filter(Boolean) : []
  const urls = a.attachment_url ? a.attachment_url.split(',') : []
  return names.map((n, i) => ({ name: n, url: urls[i] || '' }))
}
// Fiche détail : ajouter un lien à la volée
async function addDetailLink(a) {
  const l = promptLink()
  if (!l) return
  const names = a.attachment_name ? a.attachment_name.split(',').filter(Boolean) : []
  const urls = a.attachment_url ? a.attachment_url.split(',') : []
  names.push(l.name); urls.push(l.url)
  a.attachment_name = names.join(','); a.attachment_url = urls.join(',')
  await supabase.from('affair').update({ attachment_name: a.attachment_name, attachment_url: a.attachment_url }).eq('affairid', a.affairid)
  showMessage('Lien ajouté', 'success')
}

// Affaire terminée : marquée "done" à la main OU déchargement strictement passé (échu)
function isFinished(a) {
  if ((a.status || 'draft') === 'done') return true
  const d = lastBackDate(a)
  if (!d) return false
  return d < new Date().toISOString().slice(0, 10)
}

// Le texte cherché est-il présent dans les champs clés de l'affaire ?
function matchAffair(a, q) {
  const hay = [a.name, a.city, a.venue, a.event_type, a.reference,
    a.tech_firstname, a.tech_name, a.tech_firstname_monitor, a.tech_name_monitor,
    a.tech_firstname_system, a.tech_name_system, a.tech_firstname_stage, a.tech_name_stage]
    .filter(Boolean).join(' ').toLowerCase()
  return hay.includes(q)
}

const filteredAffairs = computed(() => {
  // Recherche : prioritaire, balaie TOUTES les affaires (hors corbeille), filtres ignorés
  const q = affairSearch.value.trim().toLowerCase()
  if (q && tab.value !== 'trash') {
    // Par défaut : affaires à venir ; case "passé" cochée : affaires terminées/échues
    return affairs.value
      .filter(a => matchAffair(a, q) && (searchPast.value ? isFinished(a) : !isFinished(a)))
      .map(a => ({ a, e: nextEvent(a) }))
      .sort((x, y) => (!x.e ? 1 : !y.e ? -1 : cmpEvents(x.e, y.e)))
      .map(x => x.a)
  }
  // Filtre messages (enveloppe) : exactement les affaires avec messages non lus (même passées)
  if (msgFilter.value) {
    return affairs.value
      .filter(a => !!unreadAffairs.value[a.affairid])
      .map(a => ({ a, e: nextEvent(a) }))
      .sort((x, y) => (!x.e ? 1 : !y.e ? -1 : cmpEvents(x.e, y.e)))
      .map(x => x.a)
  }
  const list = (() => {
  if (tab.value === 'trash') return trashedAffairs.value
  // Dossier Terminé : déchargement échu ou marqué terminé à la main
  if (tab.value === 'done') {
    return affairs.value
      .filter(isFinished)
      .slice()
      .sort((x, y) => ((lastBackDate(y) || '') < (lastBackDate(x) || '') ? -1 : 1))
  }
  // Affaires actives = tout sauf terminées (elles partent dans Terminé)
  const active = affairs.value.filter(a => !isFinished(a))
  // Vue temporelle : aujourd'hui / demain / semaine (tous types confondus)
  if (timeFilter.value) {
    return active
      .map(a => ({ a, k: (windowEvent(a) || {}).date }))
      .filter(x => x.k)
      .sort((x, y) => (x.k < y.k ? -1 : x.k > y.k ? 1 : 0))
      .map(x => x.a)
  }
  // Mode "à venir" : parmi les affaires actives, triées par date
  if (sortMode.value) {
    return active
      .map(a => ({ a, k: keyDate(a, sortMode.value) }))
      .filter(x => x.k)
      .sort((x, y) => (x.k < y.k ? -1 : x.k > y.k ? 1 : 0))
      .map(x => x.a)
  }
  // Aucun filtre de phase : flux chronologique fusionné (par date d'événement,
  // puis prépa → chargement → déchargement le même jour). Sans date → en fin de liste.
  const base = tab.value === 'all' ? active
    : tab.value === 'new' ? active.filter(a => isNew(a)) // affaires portant le badge NEW (à traiter)
    : active.filter(a => (a.status || 'draft') === tab.value)
  const withE = base.map(a => ({ a, e: nextEvent(a) }))
  const dated = withE.filter(x => x.e).sort((x, y) => cmpEvents(x.e, y.e))
  const undated = withE.filter(x => !x.e)
  return [...dated, ...undated].map(x => x.a)
  })()
  let out = followOnly.value ? list.filter(a => a.followed) : list
  if (managerFilter.value) out = out.filter(a => a.manager === managerFilter.value)
  if (mineOnly.value) out = out.filter(isMyAffair)
  return out
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
const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
function shortDate(d) {
  const [, m, dd] = (d || '').split('-')
  if (!dd) return ''
  const wd = WEEKDAYS[new Date(d + 'T00:00:00').getDay()]
  return `${wd} ${dd}/${m}`
}
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
      key: 'front', css: 'facade', icon: '🔵', label: 'Façade',
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
      key: 'stage', css: 'scene', icon: '🟢', label: 'Scène',
      name: affair.tech_name_stage || '?',
      firstname: affair.tech_firstname_stage || '',
      phone: affair.tech_phone_stage || '',
      email: affair.tech_email_stage || '',
    })
  }
  // Assistants
  const areaLabel = { front: 'Façade', monitor: 'Monitor', system: 'Système', stage: 'Scène' }
  const areaCss = { front: 'facade', monitor: 'retour', system: 'systeme', stage: 'scene' }
  ;(Array.isArray(affair.assistants) ? affair.assistants : []).forEach((a, i) => {
    zones.push({
      key: 'assistant' + i, css: areaCss[a.area] || 'facade', icon: '🟦',
      label: 'Assistant ' + (areaLabel[a.area] || ''),
      name: a.name || '?', firstname: a.firstname || '', phone: a.phone || '', email: a.email || '',
    })
  })
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

// --- Cliquer le nom d'une personne dans la fiche → ses affaires passées / à venir ---
const expandedPerson = ref(null) // email du contact déplié (un seul à la fois)
function togglePersonAffairs(email) {
  if (!email) return
  expandedPerson.value = expandedPerson.value === email ? null : email
}
function isOnAffair(a, email) {
  if ([a.tech_email, a.tech_email_monitor, a.tech_email_system, a.tech_email_stage].includes(email)) return true
  return Array.isArray(a.assistants) && a.assistants.some(as => as.email === email)
}
const expandedPersonAffairs = computed(() => {
  const email = expandedPerson.value
  if (!email) return { past: [], future: [] }
  const list = affairs.value.filter(a => isOnAffair(a, email))
  const past = [], future = []
  for (const a of list) (isFinished(a) ? past : future).push(a)
  const key = (a) => (nextEvent(a) || {}).date || a.created_at || ''
  future.sort((x, y) => (key(x) < key(y) ? -1 : 1))
  past.sort((x, y) => (key(x) < key(y) ? 1 : -1))
  return { past, future }
})
function affairLinkDate(a) {
  const ev = nextEvent(a)
  return ev ? shortDate(ev.date) : ''
}
function openAffairFromLink(a) {
  // s'assurer que l'affaire est visible puis ouvrir son détail
  managerFilter.value = ''; followOnly.value = false; affairSearch.value = ''
  sortMode.value = ''; timeFilter.value = ''
  tab.value = isFinished(a) ? 'done' : 'all'
  expandedPerson.value = null
  selectAffair(a)
  detailOpen.value = true
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

// Bouton "Modifier" depuis la fiche détail : ouvre le formulaire (déjà pré-rempli par selectAffair)
function editCurrentAffair() {
  showForm.value = true
}

// --- Chat (équipe + 1:1) ---
const chatOpen = ref(false)
const chatSel = ref([]) // [] = toute l'équipe ; sinon liste d'emails cochés

function toggleChat() {
  chatOpen.value = !chatOpen.value
  if (chatOpen.value && selected.value) { chatSel.value = []; reloadMessages(selected.value) }
}

// --- Chat plein écran ---
const chatModalOpen = ref(false)
const chatModalAffair = ref(null)
async function openChatModal(affair) {
  chatModalAffair.value = affair
  chatSel.value = []
  await reloadMessages(affair)
  chatModalOpen.value = true
}
function closeChatModal() { chatModalOpen.value = false }
async function sendChatModal() {
  if (!chatModalAffair.value || !masterReply.value.trim()) return
  await sendChat(chatModalAffair.value)
  closeChatModal() // se referme à l'envoi
}
async function reloadMessages(affair) {
  const { data } = await supabase.from('message').select('*').eq('affairid', affair.affairid).order('created_at', { ascending: true })
  affairMessages.value = data || []
}
function chatPeers(a) {
  const list = []
  if (a.front && a.tech_email) list.push({ email: a.tech_email, name: a.tech_firstname || a.tech_name || 'Façade' })
  if (a.monitor && a.tech_email_monitor) list.push({ email: a.tech_email_monitor, name: a.tech_firstname_monitor || a.tech_name_monitor || 'Monitor' })
  if (a.system && a.tech_email_system) list.push({ email: a.tech_email_system, name: a.tech_firstname_system || a.tech_name_system || 'Système' })
  if (a.stage && a.tech_email_stage) list.push({ email: a.tech_email_stage, name: a.tech_firstname_stage || a.tech_name_stage || 'Scène' })
  ;(Array.isArray(a.assistants) ? a.assistants : []).forEach(as => { if (as.email) list.push({ email: as.email, name: as.firstname || as.name || 'Assistant' }) })
  const seen = new Set()
  return list.filter(p => p.email && !seen.has(p.email) && seen.add(p.email))
}
function peerName(a, email) { const p = chatPeers(a).find(x => x.email === email); return p ? p.name : email }
function peerUnread(email) { return affairMessages.value.filter(m => m.peer_email === email && m.sender_role === 'tech' && !m.read_by_master).length }
const threadMessages = computed(() => {
  if (!chatSel.value.length) return affairMessages.value.filter(m => !m.peer_email)
  return affairMessages.value.filter(m => chatSel.value.includes(m.peer_email))
})
const chatUnreadCount = computed(() => affairMessages.value.filter(m => m.sender_role === 'tech' && !m.read_by_master).length)

async function selectPeer(affair, email) {
  if (!email) {
    chatSel.value = [] // Équipe (désélectionne tout)
  } else {
    const i = chatSel.value.indexOf(email)
    if (i >= 0) chatSel.value.splice(i, 1); else chatSel.value.push(email)
  }
  // marquer lus les messages des fils sélectionnés
  let q = supabase.from('message').update({ read_by_master: true }).eq('affairid', affair.affairid).eq('sender_role', 'tech')
  q = chatSel.value.length ? q.in('peer_email', chatSel.value) : q.is('peer_email', null)
  await q
  await reloadMessages(affair)
}
// E-mail aux personnes NON installées (push pour les installés, e-mail pour les autres).
// L'edge function ajoute le guide d'installation une seule fois par personne.
async function mailNonInstalled(emails, subject, message, url) {
  const targets = [...new Set((emails || []).filter(Boolean))].filter(e => !isReachable(e))
  if (!targets.length) return
  try {
    await supabase.functions.invoke('send-email', { body: { emails: targets, subject, message, url } })
  } catch (e) { /* e-mail best-effort */ }
}

async function sendChat(affair) {
  const txt = masterReply.value.trim()
  if (!txt) return
  const sel = chatSel.value.slice() // emails cochés ; vide = toute l'équipe
  const rows = sel.length
    ? sel.map(email => ({ affairid: affair.affairid, sender_role: 'master', text: txt, peer_email: email, read_by_master: true, read_by_tech: false }))
    : [{ affairid: affair.affairid, sender_role: 'master', text: txt, peer_email: null, read_by_master: true, read_by_tech: false }]
  await supabase.from('message').insert(rows)
  masterReply.value = ''
  await reloadMessages(affair)
  const payload = { title: affair.name || 'Cinod-Prep', body: txt, url: '/MasterAffaire?affair=' + affair.affairid }
  try {
    if (sel.length) await supabase.functions.invoke('send-push', { body: { ...payload, emails: sel } })
    else {
      const cid = parseInt(localStorage.getItem('cablemaster-companyid')) || resolvedCompanyId.value || null
      await supabase.functions.invoke('send-push', { body: { ...payload, companyId: cid } })
    }
  } catch (e) { /* push best-effort */ }
  // E-mail aux destinataires non installés
  const mailTargets = sel.length ? sel : chatPeers(affair).map(p => p.email)
  await mailNonInstalled(mailTargets, affair.name || 'Cinod-Prep', txt, payload.url)
}

// Notification push à l'équipe (tous les appareils installés de l'entreprise)
async function sendTeamMessage(affair) {
  const msg = prompt(`Message à l'équipe pour "${affair.name || 'affaire'}" :`, '')
  if (!msg) return
  const companyId = parseInt(localStorage.getItem('cablemaster-companyid')) || resolvedCompanyId.value || null
  const { data, error } = await supabase.functions.invoke('send-push', {
    body: { companyId, title: affair.name || 'Cinod-Prep', body: msg, url: '/MasterAffaire?affair=' + affair.affairid },
  })
  if (error) showMessage('Erreur envoi : ' + error.message, 'error')
  else showMessage(`Notification envoyée (${data?.sent || 0} appareil·s)`, 'success')
  // E-mail aux assignés non installés (+ guide d'install la 1ʳᵉ fois)
  await mailNonInstalled(chatPeers(affair).map(p => p.email), affair.name || 'Cinod-Prep', msg, '/MasterAffaire?affair=' + affair.affairid)
}

// Notification push à UNE personne (qui a installé l'app)
async function notifyPerson(affair, zone) {
  if (!zone?.email) return
  const who = zone.firstname || zone.name || ''
  const msg = prompt(`Notification à ${who} pour « ${affair.name || 'l\'affaire'} » :`, '')
  if (!msg) return
  try {
    const { data, error } = await supabase.functions.invoke('send-push', {
      body: { emails: [zone.email], title: affair.name || 'Cinod-Prep', body: msg, url: '/?affair=' + affair.affairid },
    })
    if (error) showMessage('Erreur : ' + error.message, 'error')
    else showMessage(`Notification envoyée (${data?.sent || 0} appareil·s)`, 'success')
  } catch (e) { showMessage('Erreur envoi', 'error') }
}

// Demander au(x) technicien(s) assigné(s) de remplir leur liste (micros/câbles)
async function requestList(affair) {
  const peers = chatPeers(affair)
  if (!peers.length) { showMessage('Aucun technicien assigné à cette affaire', 'error'); return }
  const text = `Bonjour, peux-tu remplir ta liste (micros / câbles) pour « ${affair.name || 'l\'affaire'} » ? Merci.`
  // Trace dans le chat (un message privé par technicien)
  await supabase.from('message').insert(peers.map(p => ({
    affairid: affair.affairid, sender_role: 'master', text,
    peer_email: p.email, read_by_master: true, read_by_tech: false,
  })))
  await reloadMessages(affair)
  // Notification push aux techniciens assignés
  try {
    await supabase.functions.invoke('send-push', {
      body: { emails: peers.map(p => p.email), title: affair.name || 'Cinod-Prep', body: text, url: '/?affair=' + affair.affairid },
    })
  } catch (e) { /* push best-effort */ }
  // E-mail aux non installés (+ guide d'installation la 1ʳᵉ fois)
  await mailNonInstalled(peers.map(p => p.email), affair.name || 'Cinod-Prep', text, '/?affair=' + affair.affairid)
  showMessage(`Demande envoyée à ${peers.length} technicien·s`, 'success')
}

// Clic sur une carte : 1er clic = ouvre l'aperçu, 2e clic = ouvre le détail complet, 3e = referme
function onCardClick(affair) {
  if (tab.value === 'trash') return
  if (selected.value?.affairid !== affair.affairid) { selectAffair(affair); detailOpen.value = false; return }
  if (!detailOpen.value) { detailOpen.value = true; return }
  selected.value = null
  detailOpen.value = false
  showForm.value = false
}

// Fermer la fiche (croix en haut à droite)
function closeCard() {
  detailOpen.value = false
  selected.value = null
  expandedPerson.value = null
}

async function selectAffair(affair) {
  showChatOnly.value = false
  selected.value = affair
  editing.value = affair
  showForm.value = false
  masterReply.value = ''
  Object.assign(form, {
    name: affair.name || '',
    reference: affair.reference || '',
    event_type: affair.event_type || '',
    city: affair.city || '',
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
    assistants: Array.isArray(affair.assistants) ? affair.assistants.map(a => ({ ...a })) : [],
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
    assistants: (form.assistants || []).filter(a => a.email || a.name),
    // Nouvelles colonnes
    reference: form.reference || '',
    event_type: form.event_type || '',
    city: form.city || '',
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

// Options d'un menu, triées par pertinence du poste : principal (●) → secondaire (○) → autres
function techOptions(poste) {
  const list = Array.isArray(technicians.value) ? technicians.value : []
  const has = (t) => (Array.isArray(t.postes) && t.postes.includes(poste)) || t.poste === poste
  const isPrim = (t) => (Array.isArray(t.postes) && t.postes.length) ? t.postes[0] === poste : t.poste === poste
  const rank = (t) => (isPrim(t) ? 0 : has(t) ? 1 : 2)
  return [...list]
    .map(t => ({ t, r: rank(t) }))
    .sort((a, b) => a.r - b.r || (a.t.name || '').localeCompare(b.t.name || ''))
    .map(({ t, r }) => ({
      email: t.email,
      label: (r === 0 ? '● ' : r === 1 ? '○ ' : '') + ((t.firstname ? t.firstname + ' ' : '') + (t.name || '')),
    }))
}

function addAssistant() {
  form.assistants.push({ area: 'front', email: '', name: '', firstname: '', phone: '' })
}
function onAssistantSelect(a) {
  const tech = technicians.value.find(t => t.email === a.email)
  if (!tech) return
  a.name = tech.name || ''
  a.firstname = tech.firstname || ''
  a.phone = tech.phone || ''
}

// Affichage "Prénom Nom" sans redoubler le prénom quand `name` contient déjà le nom complet
function personName(firstname, name) {
  const fn = (firstname || '').trim()
  const nm = (name || '').trim()
  if (!fn) return nm
  if (!nm) return fn
  if (nm.toLowerCase().startsWith(fn.toLowerCase())) return nm
  return fn + ' ' + nm
}

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
    company_id: resolvedCompanyId.value || companyId,
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
// Formulaire : enregistrer un lien (URL) parmi les documents
function addFormLink() {
  const l = promptLink()
  if (!l) return
  existingAttachments.value = [...existingAttachments.value, l.name]
  const urls = form.attachment_url ? form.attachment_url.split(',') : []
  urls.push(l.url)
  form.attachment_url = urls.join(',')
}

function showMessage(msg, type) {
  message.value = msg
  messageType.value = type
  setTimeout(() => { message.value = '' }, 3000)
}
</script>

<style scoped>
.page-title-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
.page-switch {
  padding: 6px 12px; border: 1px solid var(--color1); border-radius: 8px;
  background: var(--color1-light, #e8f5e9); color: var(--color1-dark, #2e7d32);
  font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: none; min-width: auto; white-space: nowrap;
}
.page-switch.active { background: var(--color1); color: #fff; }
.master-affaire {
  max-width: 560px;
  margin: 0 auto;
  padding: 10px 4px;
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
.tab-select {
  padding: 6px 10px;
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
.tab-select.active {
  background: var(--color1);
  color: #fff;
  border-color: var(--color1);
}
.affair-list { margin-bottom: 10px; }
.affair-card {
  position: relative;
  padding: 10px;
  border: 2px solid #ffffff;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  background: var(--bg-card, #fafafa);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
}
/* Croix + crayon : position fixe en haut à droite de la fiche */
.card-tr { position: absolute; top: 8px; right: 8px; display: flex; gap: 4px; z-index: 3; }
.affair-card.selected { border-color: var(--color1); }
.card-top { display: flex; align-items: center; gap: 6px; }
.card-status { font-size: 14px; }
.card-head { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; min-width: 0; }
/* réserve la place des actions (croix + crayon) en haut à droite quand la fiche est ouverte */
.card-head.has-actions { padding-right: 60px; }
.tech-firstname.clickable { cursor: pointer; text-decoration: underline; text-decoration-style: dotted; text-underline-offset: 3px; }
.card-name {
  flex: 1 1 auto; min-width: 0; max-width: 27ch;
  font-size: 16px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  color: var(--text, #333);
  border: 2px solid #e5e7eb; border-radius: 8px;
  padding: 4px 10px; box-sizing: border-box;
}
.manager-select {
  flex: 0 0 auto; margin-left: auto; max-width: 11ch;
  font-size: 13px; font-weight: 700; color: var(--color1);
  background: var(--bg-soft, rgba(124,58,237,0.08));
  border: 1px solid var(--border-light, #ddd); border-radius: 8px;
  padding: 3px 4px; box-shadow: none; min-width: 0; cursor: pointer;
}
.manager-chip {
  flex: 0 0 auto; margin-left: auto; max-width: 12ch;
  font-size: 13px; font-weight: 700; color: var(--color1);
  background: var(--bg-soft, rgba(0,0,0,0.05));
  border: 1px solid var(--border-light, #ddd); border-radius: 8px;
  padding: 3px 8px; cursor: pointer; box-shadow: none; min-width: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.manager-chip.none { color: var(--text-muted, #999); font-weight: 600; }
.manager-chip.active { background: var(--color1); color: #fff; border-color: var(--color1); }
/* Gérant : couleur dédiée (cyan) ; master principal : surligné jaune */
.manager-chip.mgr-gerant { border-color: #06b6d4; color: #06b6d4; font-weight: 800; }
.manager-chip.mgr-principal { background: #facc15; border-color: #eab308; color: #000; font-weight: 800; }
.manager-filter-chip {
  display: flex; align-items: center; gap: 6px; margin: 2px 0 8px;
  font-size: 13px; color: var(--text);
  background: var(--bg-section, rgba(0,0,0,0.05)); border: 1px solid var(--color1);
  border-radius: 16px; padding: 4px 10px; width: fit-content;
}
.mfc-clear { background: transparent; border: none; cursor: pointer; color: var(--text-muted, #999); font-size: 14px; padding: 0 2px; min-width: auto; box-shadow: none; }
.card-name.is-today {
  background: transparent;
  color: var(--text, #333);
  border: 3px solid #fde047;
  font-weight: 800;
}
.card-name.is-tomorrow {
  background: transparent;
  color: var(--text, #333);
  border: 3px solid #f59e0b;
  font-weight: 800;
}
.new-badge {
  background: #22c55e; color: #fff; font-size: 10px; font-weight: 800;
  padding: 1px 5px; border-radius: 6px; letter-spacing: 0.5px; flex: none;
}
.send-badge-btn {
  flex: none; background: #3b82f6; color: #fff; font-size: 11px; font-weight: 800;
  padding: 2px 8px; border: none; border-radius: 6px; cursor: pointer;
  box-shadow: none; min-width: auto;
}
.sent-badge {
  flex: none; background: var(--color1-dark, #2563eb); color: #fff;
  font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 6px; letter-spacing: 0.3px;
}
.follow-btn {
  background: transparent; border: none; cursor: pointer; font-size: 17px;
  color: #9ca3af; padding: 0 2px; line-height: 1; flex: none;
}
.follow-btn.on { color: #f59e0b; }
.card-cal-btn, .card-edit-btn {
  background: transparent; border: none; border-radius: 6px;
  font-size: 18px; line-height: 1; padding: 2px 4px; cursor: pointer; box-shadow: none; min-width: auto; flex-shrink: 0;
}
.cdl-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0 2px;
  padding: 4px 8px 4px 4px;
  background: var(--bg-input, #fff);
  border: none;
  border-radius: 10px;
}
.cdl-label {
  font-size: 11px;
  font-weight: 800;
  color: #fff;
  border-radius: 7px;
  padding: 2px 8px;
}
.cdl-prep .cdl-label, .cdl-prep-bg { background: #ea580c; }
.cdl-out .cdl-label, .cdl-out-bg { background: #3b82f6; }
.cdl-back .cdl-label, .cdl-back-bg { background: #15803d; }
.cdl-val {
  font-size: 14px;
  font-weight: 700;
  color: var(--text, #333);
}
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
.top-actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  margin-bottom: 8px;
  align-items: center;
}
.btn-create-affair {
  padding: 5px 8px;
  background: var(--color1-dark);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: none;
  flex-shrink: 0;
  white-space: nowrap;
}
/* « Mes affaires » : compact, deux lignes (Mes / affaires) pour gagner de la largeur sur téléphone */
.btn-mine {
  display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
  line-height: 1; padding: 3px 8px; border-radius: 8px; cursor: pointer; flex-shrink: 0;
  border: 1px solid var(--color1); background: transparent; color: var(--color1); box-shadow: none;
}
.btn-mine .bm-main { font-size: 12px; font-weight: 800; }
.btn-mine .bm-sub { font-size: 9px; font-weight: 600; opacity: 0.85; margin-top: 1px; }
.btn-mine.active { background: var(--color1); color: #fff; }
.btn-create-affair:active { transform: scale(0.97); }
.filter-soon {
  flex: 1 1 0;
  padding: 5px 4px;
  background: var(--bg-card, #f5f5f5);
  color: var(--text, #333);
  border: 1px solid var(--border-light, #ccc);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: none;
  min-width: 0;
  white-space: nowrap;
}
.time-filters {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
}
.time-btn {
  flex: 1 1 0;
  padding: 5px 4px;
  background: var(--bg-card, #f5f5f5);
  color: var(--text, #333);
  border: 1px solid var(--border-light, #ccc);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: none;
  min-width: 0;
  white-space: nowrap;
}
.time-btn.active { background: var(--color1-dark); border-color: var(--color1-dark); color: #fff; }
.time-btn.today.active { background: #eab308; border-color: #eab308; color: #000; }
.filter-soon.prep.active { background: #ea580c; border-color: #ea580c; color: #fff; }
.filter-soon.out.active { background: #3b82f6; border-color: #3b82f6; color: #fff; }
.filter-soon.back.active { background: #15803d; border-color: #15803d; color: #fff; }
.filter-soon.follow.active { background: #f59e0b; border-color: #f59e0b; color: #fff; }
/* Enveloppe messages (haut droite) */
.msg-btn { position: relative; }
.msg-btn.has-msg { border-color: #ef4444; }
.msg-btn.active { background: var(--color1); border-color: var(--color1); color: #fff; }
.msg-badge { position: absolute; top: -6px; right: -6px; background: #ef4444; color: #fff; font-size: 10px; font-weight: 800; min-width: 16px; height: 16px; line-height: 16px; border-radius: 8px; padding: 0 3px; text-align: center; }
/* Étoile « à suivre » (barre du bas) */
.star-btn { color: #f59e0b; font-size: 16px; font-weight: 800; }
.star-btn.active { background: #f59e0b; border-color: #f59e0b; color: #fff; }

.affair-search-bar { display: flex; align-items: center; gap: 8px; margin: 0 0 8px; }
.affair-search-field { position: relative; flex: 1; }
.affair-search-past {
  display: flex; align-items: center; gap: 4px; flex: none;
  font-size: 13px; color: var(--text-muted, #888); cursor: pointer; white-space: nowrap;
}
.affair-search-past input { accent-color: var(--color1); }
.affair-search-input {
  width: 100%; box-sizing: border-box; padding: 8px 30px 8px 12px;
  border: 1px solid var(--border-light, #ccc); border-radius: 18px;
  background: var(--bg-card, #fff); color: var(--text, #333); font-size: 14px;
}
.affair-search-input:focus { outline: none; border-color: var(--color1); }
.affair-search-clear {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  background: transparent; border: none; cursor: pointer; color: #9ca3af; font-size: 15px; padding: 2px 6px;
}
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
.dates-readonly {
  border: 1px solid var(--border-light, #ddd); border-radius: 8px;
  padding: 8px 10px; margin-top: 8px; background: var(--bg-card, #fafafa);
}
.dr-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 5px 0; }
.dr-row + .dr-row { border-top: 1px dashed var(--border-light, #eee); }
.dr-label { font-size: 11px; font-weight: 800; color: #fff; white-space: nowrap; border-radius: 7px; padding: 2px 8px; }
.dr-val { font-size: 14px; font-weight: 700; color: var(--text, #333); text-align: right; }
.cal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000;
  display: flex; align-items: center; justify-content: center; padding: 10px;
}
.cal-modal {
  background: var(--bg, #fff); border-radius: 14px; padding: 12px;
  width: 100%; max-width: 380px; height: 80vh; max-height: 80vh;
  display: flex; flex-direction: column; overflow: hidden;
}
/* Le calendrier remplit l'espace et défile à l'intérieur du modal */
.cal-modal :deep(.tour-cal) { flex: 1; min-height: 0; }
.cal-modal-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; margin-bottom: 8px; flex-shrink: 0; }
.cal-modal-title { flex: 1; text-align: center; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cal-cancel { background: transparent; border: none; font-size: 20px; line-height: 1; cursor: pointer; color: var(--text, #333); padding: 0 6px; min-width: auto; box-shadow: none; flex-shrink: 0; }
.btn-valider { padding: 7px 16px; background: #22c55e; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 800; cursor: pointer; box-shadow: none; }
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
.assistants-block { margin: 6px 0; padding: 8px; border-radius: 8px; border: 1px solid var(--border-light, #eee); border-left: 3px solid #0ea5e9; }
.assistant-row { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; }
.assistant-area { flex: 0 0 90px; }
.assistant-tech { flex: 1; min-width: 0; }
.assistant-del { flex-shrink: 0; background: transparent; border: 1px solid var(--border-light, #ccc); border-radius: 6px; padding: 4px 8px; cursor: pointer; box-shadow: none; min-width: auto; }
.btn-add-assistant { width: 100%; padding: 8px; background: var(--color1-light, #e8f5e9); color: var(--color1-dark, #2e7d32); border: 1px dashed var(--color1); border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: none; }
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
/* Point plein = connecté (app installée) ; cercle vide = non connecté.
   Couleur = métier (façade/retour/système/scène). */
.zone-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; border: 2px solid transparent; box-sizing: border-box; }
.zone-dot.facade { background: #3b82f6; border-color: #3b82f6; }
.zone-dot.retour { background: #f59e0b; border-color: #f59e0b; }
.zone-dot.systeme { background: #8b5cf6; border-color: #8b5cf6; }
.zone-dot.scene { background: #10b981; border-color: #10b981; }
.zone-dot.not-connected { background: transparent !important; }
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

/* Ligne date + bouton chat à droite */
.cdl-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.card-chat-btn {
  flex: none; display: inline-flex; align-items: center; gap: 4px;
  padding: 5px 12px; margin-left: auto;
  background: var(--bg-soft, rgba(124,58,237,0.08)); color: var(--color1-dark, var(--color1));
  border: 1.5px solid var(--color1); border-radius: 8px;
  font-size: 15px; font-weight: 800; cursor: pointer; box-shadow: none; position: relative; min-width: auto;
}
.card-chat-btn.unread { background: var(--color1); color: #fff; }
.card-chat-badge {
  background: #ef4444; color: #fff; font-size: 11px; font-weight: 900;
  border-radius: 50%; width: 16px; height: 16px; display: inline-flex;
  align-items: center; justify-content: center; margin-left: 2px;
}

/* Chat plein écran */
.chat-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.55);
  display: flex; align-items: center; justify-content: center; z-index: 300; padding: 10px;
}
.chat-modal {
  display: flex; flex-direction: column;
  width: 100%; max-width: 560px; height: 92vh;
  background: var(--bg-card, #252540); border-radius: 14px; overflow: hidden;
  border: 1px solid var(--border, #3a3a55); color: var(--text, #e0e0e0);
}
.chat-modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px;
  background: linear-gradient(180deg, #1c0f33 0%, #3d2470 100%); color: #fff;
}
.chat-modal-title { font-size: 16px; font-weight: 800; color: #fff; }
.chat-modal-close { background: transparent; border: none; font-size: 18px; cursor: pointer; color: #fff; box-shadow: none; min-width: auto; }
.chat-modal .chat-peers { padding: 10px 12px 4px; margin: 0; background: var(--bg, #1a1a2e); }
.chat-modal-messages { flex: 1; min-height: 0; overflow-y: auto; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; background: var(--bg, #1a1a2e); }
.chat-modal .chat-msg-m.tech .msg-content { background: var(--bg-card, #252540); }
.chat-modal .chat-msg-m.master .msg-content { background: var(--color1) !important; }
.chat-modal .chat-msg-m.master .msg-content p { color: #fff !important; }
.chat-modal-input { display: flex; gap: 8px; padding: 10px 12px; border-top: 1px solid var(--border, #3a3a55); background: var(--bg-card, #252540); }
.chat-modal-input input { flex: 1; min-width: 0; padding: 10px 12px; border: 1px solid var(--border-light, #444); border-radius: 10px; background: var(--bg-input, #2a2a45); color: var(--text, #e0e0e0); font-size: 15px; }
.chat-modal-input button { padding: 10px 16px; background: var(--color1); color: #fff; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; box-shadow: none; min-width: auto; }
.chat-modal-input button:disabled { opacity: 0.4; }
/* Éditeur de zones (à l'envoi) */
.zone-modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; padding: 12px; }
.zone-modal { width: 100%; max-width: 560px; max-height: 92vh; display: flex; flex-direction: column; background: var(--bg-card, #1a1a2e); border-radius: 14px; overflow: hidden; }
.zone-modal-head { display: flex; align-items: center; gap: 8px; padding: 12px 14px; background: var(--color1); }
.zone-modal-title { flex: 1; font-size: 16px; font-weight: 800; color: #fff; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.zone-modal-close { background: transparent; border: none; font-size: 18px; cursor: pointer; color: #fff; box-shadow: none; min-width: auto; }
.zone-modal-body { flex: 1; min-height: 0; overflow-y: auto; padding: 12px 14px; }
.zone-hint { font-size: 13px; color: var(--text-muted, #aaa); margin: 0 0 12px; }
.ze-block { margin-bottom: 14px; }
.ze-banner { font-weight: 800; font-size: 14px; padding: 5px 10px; border-radius: 8px 8px 0 0; color: #fff; }
.ze-banner.facade { background: #3b82f6; }
.ze-banner.retour { background: #f59e0b; }
.ze-banner.systeme { background: #8b5cf6; }
.ze-banner.scene { background: #10b981; }
.ze-block textarea {
  width: 100%; box-sizing: border-box; border: 1px solid var(--border-light, #444);
  border-top: none; border-radius: 0 0 8px 8px; padding: 10px; font-size: 14px;
  background: var(--bg-input, #2a2a45); color: var(--text, #e0e0e0); resize: vertical; line-height: 1.4;
}
.ze-docs { margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--border, #3a3a55); display: flex; flex-direction: column; gap: 6px; }
.ze-docs-title { font-size: 13px; font-weight: 700; color: var(--text-muted, #aaa); }
.ze-doc-link { font-size: 13px; color: var(--color1); text-decoration: none; }
.ze-doc-new { font-size: 13px; color: var(--text, #ccc); display: flex; align-items: center; gap: 6px; }
.ze-doc-x { background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 13px; box-shadow: none; min-width: auto; padding: 0 4px; }
.ze-doc-add { display: inline-block; align-self: flex-start; font-size: 13px; font-weight: 700; color: var(--color1); cursor: pointer; padding: 4px 0; background: transparent; border: none; box-shadow: none; min-width: auto; }
.ze-doc-row { display: flex; gap: 16px; flex-wrap: wrap; }
.ze-notify { padding: 10px 14px 0; }
.ze-notify-toggle { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: var(--text, #ddd); cursor: pointer; }
.ze-notify-msg { width: 100%; box-sizing: border-box; margin-top: 8px; border: 1px solid var(--border-light, #444); border-radius: 8px; padding: 8px; font-size: 13px; background: var(--bg-input, #2a2a45); color: var(--text, #e0e0e0); resize: vertical; line-height: 1.4; }
.zone-modal-foot { display: flex; gap: 8px; padding: 10px 14px; border-top: 1px solid var(--border, #3a3a55); }
.ze-skip { flex: 1; padding: 11px; background: transparent; border: 1px solid var(--border-light, #555); border-radius: 10px; color: var(--text, #ccc); font-weight: 700; cursor: pointer; box-shadow: none; }
.ze-send { flex: 2; padding: 11px; background: var(--color1); border: none; border-radius: 10px; color: #fff; font-weight: 800; cursor: pointer; box-shadow: none; }
.card-expanded { padding: 8px; border-top: 1px solid var(--border-light, #eee); margin-top: 6px; }
.detail-hint { margin-top: 6px; font-size: 11px; font-weight: 700; color: var(--color1-dark, #2e7d32); }

.preview-zone { cursor: pointer; }
.mini-cal {
  display: flex; flex-wrap: wrap; gap: 6px; margin-top: -2px;
  padding: 2px 0; background: transparent;
}
.fiche-cal { margin: 8px 0; }
.mini-cal-day {
  display: flex; flex-direction: column; align-items: center; gap: 1px;
  min-width: 30px; padding: 3px 2px;
}
.mcd-dow { font-size: 9px; font-weight: 700; color: var(--text, #cbd5e1); opacity: 0.85; text-transform: uppercase; }
.mcd-num { font-size: 15px; font-weight: 800; color: var(--text, #333); line-height: 1; }
.mcd-bars { display: flex; align-items: center; gap: 3px; margin-top: 2px; height: 18px; }
.mcd-mark { display: flex; align-items: center; }
.mcd-bar { width: 7px; height: 7px; border-radius: 2px; }
.mcd-arrow { font-size: 22px; font-weight: 900; line-height: 1; -webkit-text-stroke: 0.5px currentColor; }
.mini-cal-more { align-self: center; font-size: 20px; font-weight: 800; color: var(--text-muted, #999); padding: 0 6px; }
.detail-actions { margin-top: 8px; }
.btn-edit-detail {
  width: 100%; padding: 9px; background: var(--color1-dark); color: #fff; border: none;
  border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: none;
}
.fiche-person { margin-bottom: 10px; border: 1px solid var(--border-light, #eee); border-radius: 8px; overflow: hidden; }
.fiche-person-header { padding: 6px 10px; font-size: 13px; font-weight: 700; }
.fiche-person-header.facade { background: rgba(59,130,246,0.1); color: #3b82f6; }
.fiche-person-header.retour { background: rgba(245,158,11,0.1); color: #f59e0b; }
.fiche-person-header.scene { background: rgba(16,185,129,0.1); color: #10b981; }
.fiche-person-body { padding: 8px 10px; }
.fiche-contact-all { display: block; text-align: center; padding: 8px; margin-bottom: 10px; background: var(--color1); color: #fff; border-radius: 8px; font-size: 14px; font-weight: 700; text-decoration: none; }
.fiche-person-line { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; margin-bottom: 6px; }
.fiche-person-name { font-size: 15px; font-weight: 700; color: var(--text, #333); }
.fiche-person-name.clickable { cursor: pointer; text-decoration: underline; text-decoration-style: dotted; text-underline-offset: 3px; }
.person-affairs { display: flex; gap: 8px; margin-top: 8px; }
.pa-col { flex: 1; min-width: 0; }
.pa-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted, #999); margin-bottom: 4px; }
.pa-link {
  display: flex; align-items: center; justify-content: space-between; gap: 6px; width: 100%;
  text-align: left; padding: 5px 8px; margin-bottom: 4px;
  background: var(--bg-soft, rgba(0,0,0,0.05)); border: 1px solid var(--border-light, #ddd);
  border-radius: 6px; font-size: 12px; font-weight: 600; color: var(--text, #333);
  cursor: pointer; box-shadow: none; min-width: 0;
}
.pa-link.future { border-left: 3px solid var(--color1); }
.pa-link.past { border-left: 3px solid var(--text-muted, #999); opacity: 0.85; }
.pa-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pa-date { flex: none; font-size: 11px; color: var(--text-muted, #999); }
.pa-empty { font-size: 12px; color: var(--text-muted, #999); padding: 4px; }
.fiche-person-phone { font-size: 13px; color: var(--text-light, #888); }
.fiche-person-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.fiche-action-btn { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; cursor: pointer; }
.fiche-action-btn.call { background: rgba(59,130,246,0.1); color: #3b82f6; }
.fiche-action-btn.sms { background: rgba(16,185,129,0.1); color: #10b981; }
.fiche-action-btn.email { background: rgba(245,158,11,0.1); color: #f59e0b; }
.fiche-action-btn.notif { background: var(--color1); color: #fff; border: none; box-shadow: none; }
.fiche-installed { font-size: 13px; margin-left: 2px; }
.fiche-person-email { font-size: 12px; color: var(--text-light, #888); margin-bottom: 6px; }
.fiche-no-contact { font-size: 12px; color: var(--text-muted, #999); font-style: italic; margin-top: 4px; }
.chat-btn { position: relative; }
.chat-badge { position: absolute; top: -4px; right: -4px; background: #ef4444; color: #fff; font-size: 10px; font-weight: 800; border-radius: 8px; padding: 0 4px; min-width: 14px; text-align: center; line-height: 14px; }
.chat-peers { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
.chat-peer { position: relative; padding: 4px 10px; border: 1px solid var(--border-light, #ccc); border-radius: 14px; background: var(--bg-card, #f5f5f5); color: var(--text, #333); font-size: 12px; font-weight: 600; cursor: pointer; box-shadow: none; min-width: auto; }
.chat-peer.active { background: var(--color1); border-color: var(--color1); color: #fff; }
.chat-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #ef4444; margin-left: 5px; vertical-align: middle; }
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
