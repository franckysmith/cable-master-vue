<template>
  <div class="main">
    <div>
      <ModalDelete @close="isOpenNote = false" v-if="isOpenNote">
        <template v-slot:main>
          <div>
            <div>
              <h2>{{ displayNote }}</h2>
            </div>
          </div>
        </template>
        <template #body> </template>
        <template #footer>
          <button>
            fermer
          </button>
        </template>
      </ModalDelete>
    </div>

    <h1>Gestion des affaires</h1>
    <!-- <p>Date: {{ getFormat() }}</p> -->
    <p>{{ today() }}</p>
    <!-- <p>Demain : {{ tomorrow() }}</p>
    <div v-if="today() < after5()">
      <p>app demain (after2): {{ after2() }}</p>
      <p>dans 5 jours: {{ after5() }}</p>
    </div> -->
    <div class="btsearch">
      <button @click="searchInput('btsearchaff')" type="button">affaire</button>

      <button @click="searchInput('btsearchtech')" type="button">
        Technicien
      </button>
      <button @click="searchInput('btsearchref')" type="button">
        Référence
      </button>
    </div>
    <div v-if="inputType == 'btsearchaff'">
      <input type="text" placeholder="Nom de l'Affaire ?" v-model="searchAff" />
      <i class="close-search" @click="searchAff = ''">close</i>
    </div>
    <div v-if="inputType == 'btsearchtech'">
      <input
        type="text"
        placeholder="Nom du technicien ?"
        v-model="searchTech"
      />
    </div>
    <div v-if="inputType == 'btsearchref'">
      <input
        type="text"
        placeholder="Nom de la Référence ?"
        v-model="searchRef"
      />
    </div>
    <h3 v-if="searchAffaires.length == 0">Aucun résultat</h3>

    <div
      class="list-aff"
      v-for="affaire in searchAffaires"
      :key="affaire.affairid"
    >
      <div v-if="searchAff">
        <div class="content">
          <h4>{{ affaire.name }}</h4>
          <!-- <span @click="setColorIndicator(size)" class="taille"> -->

          <h5>{{ affaire.tech_name }}</h5>
        </div>
        <div class="content2">
          <div class="date-master">
            <div>
              {{
                format(new Date(affaire.prep_date), "EEEE  ", {
                  locale: fr
                })
              }}
            </div>

            <div>
              {{
                format(new Date(affaire.prep_date), "  dd MMM ", {
                  locale: fr
                })
              }}
            </div>

            <div
              class="matin-app"
              :class="
                affaire.prep_time == 'morning' ? 'gradientp' : 'gradientm'
              "
            >
              {{ affaire.prep_time == "morning" ? "ap-midi" : "matin" }}
            </div>
            <div>
              <input type="checkbox" v-model="affaire.done.master" />
            </div>
          </div>
          <button type="button">Flights</button>
          <!-- ---------- -->
          <div class="date-master">
            <div>
              {{
                format(new Date(affaire.prep_date), "EEEE  ", {
                  locale: fr
                })
              }}
            </div>

            <div>
              {{
                format(new Date(affaire.prep_date), "  dd MMM", {
                  locale: fr
                })
              }}
            </div>

            <div
              class="matin-app"
              :class="
                affaire.receipt_time == 'morning' ? 'gradientp' : 'gradientm'
              "
            >
              {{ affaire.receipt_time == "morning" ? "ap-midi" : "matin" }}
            </div>
          </div>
          <!-- ------------- -->
          <div class="date-master">
            <div>
              {{
                format(new Date(affaire.return_date), "EEEE  ", {
                  locale: fr
                })
              }}
            </div>

            <div>
              {{
                format(new Date(affaire.return_date), "  dd MMM ", {
                  locale: fr
                })
              }}
            </div>

            <div
              class="matin-app"
              :class="
                affaire.return_time == 'morning' ? 'gradientp' : 'gradientm'
              "
            >
              {{ affaire.return_time == "morning" ? "ap-midi" : "matin" }}
            </div>
          </div>
        </div>
        <div class="fiche">
          <ul>
            <li>
              <h3>Description</h3>
              <p>{{ affaire.description }}</p>
            </li>
            <li>
              <h3>Note du technicien</h3>
              <p>{{ affaire.tech_note }}</p>
            </li>
            <li>
              <h3>Note de l'atelier</h3>
              <textarea v-model="affaire.master_note" cols="45" rows="5" />
              <div>
                <button class="buttonsave" @click="update_affair" type="button">
                  Save
                </button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div v-if="searchAff == ''">
      <!-- ----------------button ------------ -->
      <div>
        <div class="button-select">
          <button @click="isOpenAff('today')" class="titre-day">
            Aujourd'hui
          </button>
          <button @click="isOpenAff('tomorrow')" class="titre-day">
            Demain
          </button>
          <button @click="isOpenAff('after')" class="titre-day">
            5 jours =>
          </button>
          <button @click="isOpenAff('futur')" class="titre-day">
            Futur
          </button>
        </div>

        <!-- ---------------- Today -------------------- -->
        <div class="today">
          <div v-if="isOpenAffSelect == 'today'" class="event-type">
            <h3 v-if="isToday(new Date(affaire.return_date))">Prépa</h3>
          </div>
          <div class="event-type" v-if="isOpenAffSelect == 'today'">
            <h3>Prépa</h3>
          </div>
          <div
            class="list-aff"
            v-for="affaire in affaires"
            :key="affaire.affairid"
          >
            <div v-if="isOpenAffSelect == 'today'">
              <div v-if="isToday(new Date(affaire.prep_date))">
                <div class="content">
                  <h4 @click="searchAff = affaire.name">{{ affaire.name }}</h4>
                  <div class="ref">
                    <h5>{{ affaire.ref }}</h5>
                  </div>
                  <h5>
                    <div @click="dial(phonedata)">{{ affaire.tech_name }}</div>
                  </h5>
                </div>
                <div class="content2">
                  <div class="date-master">
                    <div>
                      {{
                        format(new Date(affaire.prep_date), "EEEE  ", {
                          locale: fr
                        })
                      }}
                    </div>

                    <div>
                      {{
                        format(new Date(affaire.prep_date), "  dd ", {
                          locale: fr
                        })
                      }}
                    </div>

                    <div
                      class="matin-app"
                      :class="
                        affaire.prep_time == 'morning'
                          ? 'gradientp'
                          : 'gradientm'
                      "
                    >
                      {{ affaire.prep_time == "morning" ? "ap-midi" : "matin" }}
                    </div>
                    <div>
                      <input type="checkbox" v-model="affaire.done.master" />
                    </div>
                  </div>
                  <div>
                    <div class="job">
                      <div class="job-button">
                        {{ affaire.front == "1" ? "face" : "" }}
                      </div>
                      <div class="job-button">
                        {{ affaire.monitor == "1" ? "monitor" : "" }}
                      </div>
                      <div class="job-button">
                        {{ affaire.stage == "1" ? "scène" : "" }}
                      </div>
                    </div>
                    <div class="technote">
                      {{ affaire.tech_note }}
                    </div>
                  </div>

                  <div>
                    <div class="content-button">
                      <button
                        type="button"
                        @click="modalOpen(affaire.master_note)"
                        :class="affaire.master_note ? 'buttonv' : 'button'"
                      >
                        A
                      </button>

                      <button
                        type="button"
                        @click="modalOpen(affaire.tech_note)"
                        :class="affaire.tech_note ? 'buttonv' : 'button'"
                      >
                        T
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isOpenAffSelect == 'today'" class="event-type">
          <h3>Sortie</h3>
          <!-- {{ affaire.receipt_date }} -->
        </div>
        <div
          class="list-aff"
          v-for="affaire in affaires"
          :key="affaire.affairid"
        >
          <div v-if="isOpenAffSelect == 'today'">
            <div v-if="isToday(new Date(affaire.receipt_date))">
              <div class="content">
                <h4 @click="searchAff = affaire.name">{{ affaire.name }}</h4>
                <div class="ref">
                  <h5>{{ affaire.ref }}</h5>
                </div>
                <h5>
                  <div @click="dial(phonedata)">{{ affaire.tech_name }}</div>
                </h5>
              </div>
              <div class="content2">
                <div class="date-master">
                  <div>
                    {{
                      format(new Date(affaire.receipt_date), "EEEE  ", {
                        locale: fr
                      })
                    }}
                  </div>

                  <div>
                    {{
                      format(new Date(affaire.receipt_date), "  dd ", {
                        locale: fr
                      })
                    }}
                  </div>

                  <div
                    class="matin-app"
                    :class="
                      affaire.return_time == 'morning'
                        ? 'gradientp'
                        : 'gradientm'
                    "
                  >
                    {{ affaire.return_time == "morning" ? "ap-midi" : "matin" }}
                  </div>
                  <div>
                    <input type="checkbox" v-model="affaire.done.master" />
                  </div>
                </div>
                <div class="technote">
                  {{ affaire.tech_note }}
                </div>
                <div class="content-button">
                  <!-- <button
                    type="button"
                    @click="modalOpen(affaire.description)"
                    :class="affaire.description ? 'buttonv' : 'button'"
                  >
                    D
                  </button> -->

                  <button
                    type="button"
                    @click="modalOpen(affaire.master_note)"
                    :class="affaire.master_note ? 'buttonv' : 'button'"
                  >
                    A
                  </button>

                  <button
                    type="button"
                    @click="modalOpen(affaire.tech_note)"
                    :class="affaire.tech_note ? 'buttonv' : 'button'"
                  >
                    T
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="event-type" v-if="isOpenAffSelect == 'today'">
          <h3>Retour</h3>
        </div>
        <div
          class="list-aff"
          v-for="affaire in affaires"
          :key="affaire.affairid"
        >
          <div v-if="isOpenAffSelect == 'today'">
            <div v-if="isToday(new Date(affaire.return_date))">
              <div class="content">
                <h4 @click="searchAff = affaire.name">{{ affaire.name }}</h4>
                <div class="ref">
                  <h5>{{ affaire.ref }}</h5>
                </div>
                <h5>
                  <div @click="dial(phonedata)">{{ affaire.tech_name }}</div>
                </h5>
              </div>
              <div class="content2">
                <div class="date-master">
                  <div>
                    {{
                      format(new Date(affaire.return_date), "EEEE ", {
                        locale: fr
                      })
                    }}
                  </div>
                  <div>
                    {{
                      format(new Date(affaire.return_date), "  dd ", {
                        locale: fr
                      })
                    }}
                  </div>

                  <div
                    class="matin-app"
                    :class="
                      affaire.return_time == 'morning'
                        ? 'gradientp'
                        : 'gradientm'
                    "
                  >
                    {{ affaire.return_time == "morning" ? "ap-midi" : "matin" }}
                  </div>
                  <div>
                    <input type="checkbox" v-model="affaire.done.master" />
                  </div>
                </div>
                <!-- <div class="technote">
                  {{ affaire.tech_note }}
                </div> -->
                <div class="content-button">
                  <!-- <button
                    type="button"
                    @click="modalOpen(affaire.description)"
                    :class="affaire.description ? 'buttonv' : 'button'"
                  >
                    D
                  </button> -->

                  <button
                    type="button"
                    @click="modalOpen(affaire.master_note)"
                    :class="affaire.master_note ? 'buttonv' : 'button'"
                  >
                    A
                  </button>

                  <button
                    type="button"
                    @click="modalOpen(affaire.tech_note)"
                    :class="affaire.tech_note ? 'buttonv' : 'button'"
                  >
                    T
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- ---------------Tomorrow -------------------------------- -->

      <div class="tomorrow">
        <div v-if="isOpenAffSelect == 'tomorrow'" class="event-type">
          <h3 v-if="isTomorrow(new Date(affaire.return_date))">Prépa</h3>
        </div>
        <div class="event-type" v-if="isOpenAffSelect == 'tomorrow'">
          <h3>Prépa</h3>
        </div>
        <div
          class="list-aff"
          v-for="affaire in affaires"
          :key="affaire.affairid"
        >
          <div v-if="isOpenAffSelect == 'tomorrow'">
            <div v-if="isTomorrow(new Date(affaire.return_date))">
              <div class="content">
                <h4 @click="searchAff = affaire.name">{{ affaire.name }}</h4>
                <div class="ref">
                  <h5>{{ affaire.ref }}</h5>
                </div>
                <h5>
                  <div @click="dial(phonedata)">{{ affaire.tech_name }}</div>
                </h5>
              </div>
              <div class="content2">
                <div class="date-master">
                  <div>
                    {{
                      format(new Date(affaire.return_date), "EEEE  ", {
                        locale: fr
                      })
                    }}
                  </div>
                  <div>
                    {{
                      format(new Date(affaire.return_date), " dd ", {
                        locale: fr
                      })
                    }}
                  </div>

                  <div
                    class="matin-app"
                    :class="
                      affaire.return_time == 'morning'
                        ? 'gradientp'
                        : 'gradientm'
                    "
                  >
                    {{ affaire.return_time == "morning" ? "ap-midi" : "matin" }}
                  </div>
                </div>
                <!-- <div class="technote">
                  {{ affaire.tech_note }}
                </div> -->
                <div class="content-button">
                  <!-- <button
                    type="button"
                    @click="modalOpen(affaire.description)"
                    :class="affaire.description ? 'buttonv' : 'button'"
                  >
                    D
                  </button> -->

                  <button
                    type="button"
                    @click="modalOpen(affaire.master_note)"
                    :class="affaire.master_note ? 'buttonv' : 'button'"
                  >
                    A
                  </button>

                  <button
                    type="button"
                    @click="modalOpen(affaire.tech_note)"
                    :class="affaire.tech_note ? 'buttonv' : 'button'"
                  >
                    T
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="isOpenAffSelect == 'tomorrow'" class="event-type">
          <h3>Sortie</h3>
          <!-- {{ affaire.receipt_date }} -->
        </div>
        <div
          class="list-aff"
          v-for="affaire in affaires"
          :key="affaire.affairid"
        >
          <div v-if="isOpenAffSelect == 'tomorrow'">
            <div v-if="isTomorrow(new Date(affaire.receipt_date))">
              <div class="content">
                <h4 @click="searchAff = affaire.name">{{ affaire.name }}</h4>
                <div class="ref">
                  <h5>{{ affaire.ref }}</h5>
                </div>
                <h5>
                  <div @click="dial(phonedata)">{{ affaire.tech_name }}</div>
                </h5>
              </div>
              <div class="content2">
                <div class="date-master">
                  <div>
                    {{
                      format(new Date(affaire.receipt_date), "EEEE   ", {
                        locale: fr
                      })
                    }}
                  </div>
                  <div>
                    {{
                      format(new Date(affaire.receipt_date), "  dd ", {
                        locale: fr
                      })
                    }}
                  </div>

                  <div
                    class="matin-app"
                    :class="
                      affaire.receipt_time == 'morning'
                        ? 'gradientp'
                        : 'gradientm'
                    "
                  >
                    {{
                      affaire.receipt_time == "morning" ? "ap-midi" : "matin"
                    }}
                  </div>
                </div>
                <div class="technote">
                  {{ affaire.tech_note }}
                </div>
                <div class="content-button">
                  <!-- <button
                    type="button"
                    @click="modalOpen(affaire.description)"
                    :class="affaire.description ? 'buttonv' : 'button'"
                  >
                    D
                  </button> -->

                  <button
                    type="button"
                    @click="modalOpen(affaire.master_note)"
                    :class="affaire.master_note ? 'buttonv' : 'button'"
                  >
                    A
                  </button>

                  <button
                    type="button"
                    @click="modalOpen(affaire.tech_note)"
                    :class="affaire.tech_note ? 'buttonv' : 'button'"
                  >
                    T
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="isOpenAffSelect == 'tomorrow'" class="event-type">
          <h3>Retour</h3>
          <!-- {{ affaire.receipt_date }} -->
        </div>
        <div
          class="list-aff"
          v-for="affaire in affaires"
          :key="affaire.affairid"
        >
          <div v-if="isOpenAffSelect == 'tomorrow'">
            <div v-if="isTomorrow(new Date(affaire.return_date))">
              <div class="content">
                <h4 @click="searchAff = affaire.name">{{ affaire.name }}</h4>
                <div class="ref">
                  <h5>{{ affaire.ref }}</h5>
                </div>
                <h5>
                  <div @click="dial(phonedata)">{{ affaire.tech_name }}</div>
                </h5>
              </div>
              <div class="content2">
                <div class="date-master">
                  <div>
                    {{
                      format(new Date(affaire.return_date), "EEEE   ", {
                        locale: fr
                      })
                    }}
                  </div>
                  <div>
                    {{
                      format(new Date(affaire.return_date), "  dd ", {
                        locale: fr
                      })
                    }}
                  </div>

                  <div
                    class="matin-app"
                    :class="
                      affaire.return_time == 'morning'
                        ? 'gradientp'
                        : 'gradientm'
                    "
                  >
                    {{ affaire.return_time == "morning" ? "ap-midi" : "matin" }}
                  </div>
                </div>
                <!-- <div class="technote">
                  {{ affaire.tech_note }}
                </div> -->
                <div class="content-button">
                  <!-- <button
                    type="button"
                    @click="modalOpen(affaire.description)"
                    :class="affaire.description ? 'buttonv' : 'button'"
                  >
                    D
                  </button> -->

                  <button
                    type="button"
                    @click="modalOpen(affaire.master_note)"
                    :class="affaire.master_note ? 'buttonv' : 'button'"
                  >
                    A
                  </button>

                  <button
                    type="button"
                    @click="modalOpen(affaire.tech_note)"
                    :class="affaire.tech_note ? 'buttonv' : 'button'"
                  >
                    T
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- -----------------------(2)After(5)---------------------------------- -->
      <div class="after">
        <div v-if="isOpenAffSelect == 'after'" class="event-type">
          <h3>Prépa</h3>
        </div>

        <div
          class="list-aff"
          v-for="affaire in affaires"
          :key="affaire.affairid"
        >
          <div v-if="isOpenAffSelect == 'after'">
            <div
              v-if="
                after2() < affaire.return_date &&
                  affaire.return_date <= after5()
              "
            >
              <div class="content">
                <h4 @click="searchAff = affaire.name">{{ affaire.name }}</h4>
                <div class="ref">
                  <h5>{{ affaire.ref }}</h5>
                </div>
                <h5>
                  <div @click="dial(phonedata)">{{ affaire.tech_name }}</div>
                </h5>
              </div>
              <div class="content2">
                <div class="date-master">
                  <div>
                    {{
                      format(new Date(affaire.return_date), "EEEE   ", {
                        locale: fr
                      })
                    }}
                  </div>

                  <div>
                    {{
                      format(new Date(affaire.return_date), " dd ", {
                        locale: fr
                      })
                    }}
                  </div>

                  <div
                    class="matin-app"
                    :class="
                      affaire.return_time == 'morning'
                        ? 'gradientp'
                        : 'gradientm'
                    "
                  >
                    {{ affaire.return_time == "morning" ? "ap-midi" : "matin" }}
                  </div>
                </div>
                <!-- <div class="technote">
                  {{ affaire.tech_note }}
                </div> -->
                <div class="content-button">
                  <!-- <button
                    type="button"
                    @click="modalOpen(affaire.description)"
                    :class="affaire.description ? 'buttonv' : 'button'"
                  >
                    D
                  </button> -->

                  <button
                    type="button"
                    @click="modalOpen(affaire.master_note)"
                    :class="affaire.master_note ? 'buttonv' : 'button'"
                  >
                    A
                  </button>

                  <button
                    type="button"
                    @click="modalOpen(affaire.tech_note)"
                    :class="affaire.tech_note ? 'buttonv' : 'button'"
                  >
                    T
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="isOpenAffSelect == 'after'" class="event-type">
          <h3>Sortie</h3>
          <!-- {{ affaire.receipt_date }} -->
        </div>
        <div
          class="list-aff"
          v-for="affaire in affaires"
          :key="affaire.affairid"
        >
          <div v-if="isOpenAffSelect == 'after'">
            <div
              v-if="
                after2() < affaire.receipt_date &&
                  affaire.receipt_date <= after5()
              "
            >
              <div class="content">
                <h4 @click="searchAff = affaire.name">{{ affaire.name }}</h4>
                <div class="ref">
                  <h5>{{ affaire.ref }}</h5>
                </div>
                <h5>
                  <div @click="dial(phonedata)">{{ affaire.tech_name }}</div>
                </h5>
              </div>
              <div class="content2">
                <div class="date-master">
                  <div>
                    {{
                      format(new Date(affaire.receipt_date), "EEEE  ", {
                        locale: fr
                      })
                    }}
                  </div>
                  <div>
                    {{
                      format(new Date(affaire.receipt_date), " dd ", {
                        locale: fr
                      })
                    }}
                  </div>

                  <div
                    class="matin-app"
                    :class="
                      affaire.receipt_time == 'morning'
                        ? 'gradientp'
                        : 'gradientm'
                    "
                  >
                    {{
                      affaire.receipt_time == "morning" ? "ap-midi" : "matin"
                    }}
                  </div>
                </div>
                <div class="technote">
                  {{ affaire.tech_note }}
                </div>
                <div class="content-button">
                  <!-- <button
                    type="button"
                    @click="modalOpen(affaire.description)"
                    :class="affaire.description ? 'buttonv' : 'button'"
                  >
                    D
                  </button> -->

                  <button
                    type="button"
                    @click="modalOpen(affaire.master_note)"
                    :class="affaire.master_note ? 'buttonv' : 'button'"
                  >
                    A
                  </button>

                  <button
                    type="button"
                    @click="modalOpen(affaire.tech_note)"
                    :class="affaire.tech_note ? 'buttonv' : 'button'"
                  >
                    T
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="isOpenAffSelect == 'after'" class="event-type">
          <h3>Retour</h3>
          <!-- {{ affaire.receipt_date }} -->
        </div>
        <div
          class="list-aff"
          v-for="affaire in affaires"
          :key="affaire.affairid"
        >
          <div v-if="isOpenAffSelect == 'after'">
            <div
              v-if="
                after2() < affaire.return_date &&
                  affaire.return_date <= after5()
              "
            >
              <div class="content">
                <h4 @click="searchAff = affaire.name">{{ affaire.name }}</h4>
                <div class="ref">
                  <h5>{{ affaire.ref }}</h5>
                </div>
                <h5>
                  <div @click="dial(phonedata)">{{ affaire.tech_name }}</div>
                </h5>
              </div>
              <div class="content2">
                <div class="date-master">
                  <div>
                    {{
                      format(new Date(affaire.return_date), "EEEE  ", {
                        locale: fr
                      })
                    }}
                  </div>
                  <div>
                    {{
                      format(new Date(affaire.return_date), " dd ", {
                        locale: fr
                      })
                    }}
                  </div>

                  <div
                    :class="
                      affaire.return_time == 'morning'
                        ? 'gradientp'
                        : 'gradientm'
                    "
                  >
                    {{ affaire.return_time == "morning" ? "ap-midi" : "matin" }}
                  </div>
                </div>
                <!-- <div class="technote">
                  {{ affaire.tech_note }}
                </div> -->
                <div class="content-button">
                  <!-- <button
                    type="button"
                    @click="modalOpen(affaire.description)"
                    :class="affaire.description ? 'buttonv' : 'button'"
                  >
                    D
                  </button> -->

                  <button
                    type="button"
                    @click="modalOpen(affaire.master_note)"
                    :class="affaire.master_note ? 'buttonv' : 'button'"
                  >
                    A
                  </button>

                  <button
                    type="button"
                    @click="modalOpen(affaire.tech_note)"
                    :class="affaire.tech_note ? 'buttonv' : 'button'"
                  >
                    T
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- -------------------  Futur ....... -------------------------->
      <div class="futur">
        <div v-if="isOpenAffSelect == 'futur'" class="event-type">
          <h3>Prépa</h3>
        </div>

        <div
          class="list-aff"
          v-for="affaire in affaires"
          :key="affaire.affairid"
        >
          <div v-if="isOpenAffSelect == 'futur'">
            <div v-if="affaire.return_date > after5()">
              <div class="content">
                <h4 @click="searchAff = affaire.name">{{ affaire.name }}</h4>
                <div class="ref">
                  <h5>{{ affaire.ref }}</h5>
                </div>
                <h5>
                  <div @click="dial(phonedata)">{{ affaire.tech_name }}</div>
                </h5>
              </div>
              <div class="content2">
                <div class="date-master">
                  <div>
                    {{
                      format(new Date(affaire.return_date), "EEEE  ", {
                        locale: fr
                      })
                    }}
                  </div>
                  <div>
                    {{
                      format(new Date(affaire.return_date), " dd ", {
                        locale: fr
                      })
                    }}
                  </div>

                  <div
                    class="matin-app"
                    :class="
                      affaire.return_time == 'morning'
                        ? 'gradientp'
                        : 'gradientm'
                    "
                  >
                    {{ affaire.return_time == "morning" ? "ap-midi" : "matin" }}
                  </div>
                </div>
                <!-- <div class="technote">
                  {{ affaire.tech_note }}
                </div> -->
                <div class="content-button">
                  <!-- <button
                    type="button"
                    @click="modalOpen(affaire.description)"
                    :class="affaire.description ? 'buttonv' : 'button'"
                  >
                    D
                  </button> -->

                  <button
                    type="button"
                    @click="modalOpen(affaire.master_note)"
                    :class="affaire.master_note ? 'buttonv' : 'button'"
                  >
                    A
                  </button>

                  <button
                    type="button"
                    @click="modalOpen(affaire.tech_note)"
                    :class="affaire.tech_note ? 'buttonv' : 'button'"
                  >
                    T
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="isOpenAffSelect == 'futur'" class="event-type">
          <h3>Sortie</h3>
          <!-- {{ affaire.receipt_date }} -->
        </div>
        <div
          class="list-aff"
          v-for="affaire in affaires"
          :key="affaire.affairid"
        >
          <div v-if="isOpenAffSelect == 'futur'">
            <div
              v-if="
                after2() < affaire.receipt_date &&
                  affaire.receipt_date <= after5()
              "
            >
              <div class="content">
                <h4 @click="searchAff = affaire.name">{{ affaire.name }}</h4>
                <div class="ref">
                  <h5>{{ affaire.ref }}</h5>
                </div>
                <h5>
                  <div @click="dial(phonedata)">{{ affaire.tech_name }}</div>
                </h5>
              </div>
              <div class="content2">
                <div class="date-master">
                  <div>
                    {{
                      format(new Date(affaire.receipt_date), "EEEE  ", {
                        locale: fr
                      })
                    }}
                  </div>

                  <div>
                    {{
                      format(new Date(affaire.receipt_date), "  dd ", {
                        locale: fr
                      })
                    }}
                  </div>

                  <div
                    class="matin-app"
                    :class="
                      affaire.receipt_time == 'morning'
                        ? 'gradientp'
                        : 'gradientm'
                    "
                  >
                    {{
                      affaire.receipt_time == "morning" ? "ap-midi" : "matin"
                    }}
                  </div>
                </div>
                <div class="technote">
                  {{ affaire.tech_note }}
                </div>
                <div class="content-button">
                  <!-- <button
                    type="button"
                    @click="modalOpen(affaire.description)"
                    :class="affaire.description ? 'buttonv' : 'button'"
                  >
                    D
                  </button> -->

                  <button
                    type="button"
                    @click="modalOpen(affaire.master_note)"
                    :class="affaire.master_note ? 'buttonv' : 'button'"
                  >
                    A
                  </button>

                  <button
                    type="button"
                    @click="modalOpen(affaire.tech_note)"
                    :class="affaire.tech_note ? 'buttonv' : 'button'"
                  >
                    T
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="isOpenAffSelect == 'futur'" class="event-type">
          <h3>Retour</h3>
          <!-- {{ affaire.receipt_date }} -->
        </div>
        <div
          class="list-aff"
          v-for="affaire in affaires"
          :key="affaire.affairid"
        >
          <div v-if="isOpenAffSelect == 'futur'">
            <div
              v-if="
                after2() < affaire.return_date &&
                  affaire.return_date <= after5()
              "
            >
              <div class="content">
                <h4 @click="searchAff = affaire.name">{{ affaire.name }}</h4>
                <div class="ref">
                  <h5>{{ affaire.ref }}</h5>
                </div>
                <h5>
                  <div @click="dial(phonedata)">{{ affaire.tech_name }}</div>
                </h5>
              </div>
              <div class="content2">
                <div class="date-master">
                  <div>
                    {{
                      format(new Date(affaire.return_date), "EEEE   ", {
                        locale: fr
                      })
                    }}
                  </div>
                  <div>
                    {{
                      format(new Date(affaire.return_date), " dd ", {
                        locale: fr
                      })
                    }}
                  </div>

                  <div
                    class="matin-app"
                    :class="
                      affaire.return_time == 'morning'
                        ? 'gradientp'
                        : 'gradientm'
                    "
                  >
                    {{ affaire.return_time == "morning" ? "ap-midi" : "matin" }}
                  </div>
                </div>
                <div class="technote">
                  {{ affaire.tech_note }}
                </div>
                <div class="content-button">
                  <!-- <button
                    type="button"
                    @click="modalOpen(affaire.description)"
                    :class="affaire.description ? 'buttonv' : 'button'"
                  >
                    D
                  </button> -->

                  <button
                    type="button"
                    @click="modalOpen(affaire.master_note)"
                    :class="affaire.master_note ? 'buttonv' : 'button'"
                  >
                    A
                  </button>

                  <button
                    type="button"
                    @click="modalOpen(affaire.tech_note)"
                    :class="affaire.tech_note ? 'buttonv' : 'button'"
                  >
                    T
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ModalDelete from "@/components/ModalDelete.vue";
// import AffaireMaster from "@/components/AffaireMaster.vue";
import { Api } from "../js/api.js";
var url = "https://cinod.fr/cables/api.php";
var api = new Api(url);
// import cablageServices from "@/services/cablage.js";
import {
  format,
  subDays,
  formatRelative,
  startOfTomorrow,
  isTomorrow,
  addDays,
  isAfter,
  isToday,
  isYesterday,
  add
} from "date-fns";
import { fr } from "date-fns/locale";
import { ref, onMounted, computed } from "vue";
import cablageServices from "@/services/cablage.js";

export default {
  name: "MasterAffaire",
  components: { ModalDelete },

  setup() {
    let affaires = ref([]);
    let cables = ref([]);
    let affaire = ref("");
    const morning = "";
    const isOpenNote = ref(false);
    const displayNote = ref("");
    const dateP = "date_prep";
    const phonedata = "0663689054";

    // ---------- dial ------------------------

    function dial(number) {
      window.location = "tel:" + number;
    }

    // ------------------ search button -----------------

    const inputType = ref("");
    function searchInput(data) {
      inputType.value = data;
    }

    // ---- recherche dans liste cable par search.... ------------
    const searchAff = ref("");
    const searchTech = ref("");
    const searchRef = ref("");

    const searchAffaires = computed(() => {
      // console.log("SearchAffaires:",SearchAffaires);
      return affaires.value.filter(affaire => {
        return (
          affaire.name.toLowerCase().includes(searchAff.value.toLowerCase()) &&
          affaire.tech_name
            .toLowerCase()
            .includes(searchTech.value.toLowerCase())
        );
      });
    });

    function modalOpen(data) {
      displayNote.value = data;
      isOpenNote.value = true;
      // console.log("countfc.value | data:", data);
    }

    // get affaire
    let affair_get = onMounted(() => {
      api
        .call("affair_get")
        .then(response => {
          affaires.value = response;
          ordersAff(affaires);
          console.log("affair_get:", response);
        })
        .catch(response => {
          console.log("err_affair_get:", response);
        });
    });

    // --------------- count orders by Aff -------------
    let affOrders = ref([]);
    let arrCountAff = ref([]);
    let totalCountAff = ref(0);

    function ordersAff(affOrders) {
      let total = 0;
      const counts = {}; // counts by cableids

      for (let { cableid, count } of affOrders.value) {
        count *= 1; // convert to integer
        total += count;

        if (counts[cableid]) count += counts[cableid].count;

        counts[cableid] = { cableid, count };
      }
      totalCountAff.value = total;
      arrCountAff.value = Object.values(counts);

      console.log("totalCountAff:", totalCountAff.value);
      console.log("arrCountAff:", arrCountAff.value);
    }

    let cable_get = onMounted(() => {
      api
        .call("cable_get")
        .then(response => {
          cables.value = response;
          console.log("cable_get:", response);
        })
        .catch(response => {
          console.log("err_cable_get:", response);
        });
    });

    // --------------- update affaire
    const message = ref("");
    async function update_affair(param) {
      // console.log("formaffair | affairupdate", param);
      const res = await cablageServices.affaireupdate(param);
      console.log("res", res);
      showMessage(res.msg);
    }
    function showMessage(text) {
      message.value = text;
      setTimeout(() => {
        message.value = "";
      }, 3000);
    }

    // let size = ref("");
    // const setColorIndicator = computed(() => {
    //   console.log("affaire.value.tech_id::", size.value);
    //   if (size.value < "30") {
    //     return "grey";
    //     // } else if (size >= "30" && size < "70") {
    //     //   return "orange";
    //   } else {
    //     return "red";
    //   }
    // });
    let ficheSelected = ref([]);
    function ficheColor(data) {
      ficheSelected.value = data;
    }
    function getFormat() {
      // return this.format(new Date(), "'Today is a' eeee");
      return this.formatRelative(subDays(new Date(), 6), new Date(), {
        locale: fr
      });
    }
    let isOpenAffSelect = ref("today");
    function isOpenAff(data) {
      isOpenAffSelect.value = data;
      console.log("isOpenAffSelect", isOpenAffSelect.value);
    }
    function today() {
      return format(new Date(), "eeee dd MMMM yyyy", { locale: fr });
    }
    function tomorrow() {
      const date = new Date();
      return format(addDays(date, 1), "yyyy-MM-dd");
    }
    function after2() {
      const date = new Date();
      return format(addDays(date, 2), "yyyy-MM-dd");
    }
    function after5() {
      const date = new Date();
      return format(addDays(date, 5), "yyyy-MM-dd");
    }

    // function showIcon(data) {
    //   if (data == "morning") {
    //     return img src= "favicon.ico";
    //   }
    // }
    // const tomorrow = startOfTomorrow();

    // let sortedAffaires = computed(() => {
    //   return affaires.value.sort((e1, e2) => {
    //     return e1.affaire.returna_date < e2.affaire.returna_date ? 1 : -1;
    //   });
    // });

    // let unarchivedAffaires = computed(() => {
    //   return sortedAffaires.value.filter(e => !e.archived);
    // });

    return {
      addDays,
      add,
      affaires,
      affOrders,
      after2,
      after5,
      // affairToday,
      affaire,

      cable_get,
      cables,
      dateP,
      dial,
      affair_get,
      ficheColor,
      ficheSelected,
      isAfter,
      isOpenNote,
      isOpenAffSelect,
      isOpenAff,
      isTomorrow,
      isToday,
      inputType,
      isYesterday,
      modalOpen,
      displayNote,
      format,
      formatRelative,
      ordersAff,
      phonedata,
      subDays,
      // size,
      // showIcon,
      searchAff,
      searchTech,
      searchRef,
      searchInput,
      searchAffaires,
      // setColorIndicator,
      today,
      tomorrow,
      update_affair,
      startOfTomorrow,
      fr,

      getFormat,
      morning

      // unarchivedAffaires,
      // sortedAffaires
    };
  }
};
</script>

<style scoped>
.btsearch {
  margin: 5px;
}
.btsearch button {
  margin-right: 5px;
}
.button-save {
  /* width: 40px; */
}

.button-select {
  display: flex;
  width: 350px;
}
.button {
  margin: 10px;
  padding: 5px;
  width: 20px;
  background: #dce0dd;
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
.buttonv {
  margin: 10px;
  padding: 5px;
  width: 20px;
  background: #4dcc59;

  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
.checkbox {
  border: 1px solid black;
  padding: 2px;
}
.clickable {
  cursor: pointer;
}
.content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* width: 365px; */
  height: 35px;
  background: rgb(251, 251, 251);
  padding: 5px;
  margin-top: auto;
  /* width: 345px; */
}
.content2 {
  display: flex;
  justify-content: space-between;
  width: 360px;
  align-items: center;
  margin: auto;
  border-left: 5px solid rgb(23, 180, 102);
  border-top: 1px black solid;
  border-bottom: 1px black solid;
  border-right: 1px black solid;
  min-height: 74px;
  border-radius: 10px;
  box-shadow: 0px -7px 18px 3px #e8e8e8;
  position: relative;
}
.content-button {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.content h5,
h4 {
  cursor: pointer;
}

h4 {
  width: 220px;
  height: 15px;
  text-align: left;
}

.event-type {
  display: flex;
  margin: 0px 5px;
}
.event-type h3 {
  color: red;
  height: 10px;
}
.head-today {
  padding-left: 170px;
  display: flex;
}
.head-label {
  padding-left: 50px;
}

h5 {
  width: 60px;
  text-align: center;
  overflow: hidden;
}
.job {
  position: absolute;
  display: flex;
  top: 1px;
  left: 70px;
  font-size: 0.7rem;
  /* display: flex; */
  margin-left: 10px;
}
.job-button {
  margin-right: 5px;
  padding: 3px;
  color: rgb(239, 239, 245);
  background: rgb(82, 81, 81);
}
.list-aff {
  width: 365px;
}

.main {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.matin-app {
  font-size: 0.7rem;
}

.taille {
  padding: 5px;
  font-size: 10px;
}
.technote {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  overflow: hidden;
  font-size: 12px;
  text-align: left;
  margin: 20px 5px 10px 8px;
  /* padding: 10px 5px; */
}
.titre-day {
  display: flex;
  margin: 10px;
  padding: 5px;
  background: #4dcc59;
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}

.fiche ul {
  text-align: left;
  padding-left: 10px;
}
.fiche li {
  width: 345px;
  margin: auto;
  font-size: 0.9rem;
}
.fiche li p {
  font-weight: 300;
}
.red {
  background-color: red;
}
.orange {
  background-color: orange;
}
.grey {
  background-color: rgb(255, 251, 251);
}
.gradientp {
  white-space: wrap;
  width: 70px;
  background: rgb(241, 241, 249);
  background: linear-gradient(
    90deg,
    rgba(241, 241, 249, 1) 41%,
    rgba(77, 204, 89, 1) 100%
  );
}
.gradientm {
  white-space: wrap;
  width: 70px;
  background: rgb(74, 74, 143);
  background: linear-gradient(
    270deg,
    rgba(241, 241, 249, 1) 41%,
    rgba(77, 204, 89, 1) 100%
  );
}
</style>
