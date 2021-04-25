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
        <template #footer>
          <button>
            fermer
          </button>
        </template>
      </ModalDelete>
    </div>

    <h1>Gestion des affaires</h1>
    <p>Date: {{ getFormat() }}</p>
    <p>Aujourd'hui: {{ today() }}</p>
    <p>Demain : {{ tomorrow() }}</p>
    <div v-if="today() < after5()">
      <p>app demain (after2): {{ after2() }}</p>
      <p>dans 5 jours: {{ after5() }}</p>
    </div>

    <div>
      <input type="text" placeholder="Qui l'utilise ?" />
    </div>
    <div>
      <div class="button-select">
        <button @click="isOpenAff('today')" class="titre-day">
          Aujourd'hui
        </button>
        <button @click="isOpenAff('tomorrow')" class="titre-day">
          Demain
        </button>
        <button @click="isOpenAff('after')" class="titre-day">
          5 jours suivants
        </button>
        <button @click="isOpenAff('futur')" class="titre-day">
          Futur
        </button>
      </div>
      <div class="head-label">
        <ul class="head-today">
          <li style="padding-left:9px">Desc</li>
          <li style="padding-left:8px">Tech</li>
          <li style="padding-left:8px">Atel</li>
        </ul>
      </div>
      <div v-if="isOpenAffSelect == 'today'" class="event-type">
        <h3>Prépa</h3>

        <!-- {{ affaire.receipt_date }} -->
      </div>
      <div class="list-aff" v-for="affaire in affaires" :key="affaire.affairid">
        <div v-if="isOpenAffSelect == 'today'">
          <div v-if="isToday(new Date(affaire.prep_date))">
            <!-- <div v-if="isToday(new Date(affaire.prep_date))"> -->

            <div class="content">
              <!-- <li>
                <input type="checkbox" />
              </li> -->
              <div>
                <h4>{{ affaire.name }}</h4>
              </div>
              <div>
                <h5>{{ affaire.tech_name }}</h5>
              </div>

              <div>
                <h5 class="taille">{{ affaire.tech_id }}</h5>
              </div>
            </div>
            <div class="fiche2">
              <div>
                <div>
                  {{
                    format(new Date(affaire.prep_date), "EEEE  MM ", {
                      locale: fr
                    })
                  }}
                </div>
                <div class="date-s">
                  {{ (affaire.prep_time = morning ? "Matin" : "Ap-midi") }}
                </div>
                <div>
                  <button
                    type="button"
                    @click="modalOpen(affaire.description)"
                    :class="affaire.description ? 'buttonv' : 'button'"
                  ></button>
                </div>
                <div>
                  <button
                    type="button"
                    @click="modalOpen(affaire.master_note)"
                    :class="affaire.master_note ? 'buttonv' : 'button'"
                  ></button>
                </div>
                <div>
                  <button
                    type="button"
                    @click="modalOpen(affaire.tech_note)"
                    :class="affaire.tech_note ? 'buttonv' : 'button'"
                  ></button>
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
      <div class="list-aff" v-for="affaire in affaires" :key="affaire.affairid">
        <div v-if="isOpenAffSelect == 'today'">
          <div v-if="isToday(new Date(affaire.receipt_date))">
            <ul class="content">
              <!-- <li>
              <input type="checkbox" />
            </li> -->
              <li>
                <h4>{{ affaire.name }}</h4>
              </li>
              <li>
                <h5>{{ affaire.tech_name }}</h5>
              </li>

              <li>
                <h5 class="taille">{{ affaire.tech_id }}</h5>
              </li>

              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.description)"
                  :class="affaire.description ? 'buttonv' : 'button'"
                ></button>
              </li>
              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.master_note)"
                  :class="affaire.master_note ? 'buttonv' : 'button'"
                ></button>
              </li>
              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.tech_note)"
                  :class="affaire.tech_note ? 'buttonv' : 'button'"
                ></button>
              </li>
            </ul>
            <div class="fiche2">
              {{
                format(new Date(affaire.receipt_date), "EEEE  MM ", {
                  locale: fr
                })
              }}
              <li class="date-s">
                {{ (affaire.receipt_time = morning ? "Matin" : "Ap-midi") }}
              </li>
            </div>
          </div>
        </div>
      </div>
      <div class="event-type" v-if="isOpenAffSelect == 'today'">
        <h3>Retour</h3>
        <!-- {{ affaire.receipt_date }} -->
      </div>
      <div class="list-aff" v-for="affaire in affaires" :key="affaire.affairid">
        <div v-if="isOpenAffSelect == 'today'">
          <div v-if="isToday(new Date(affaire.return_date))">
            <ul class="content">
              <!-- <li>
              <input type="checkbox" />
              </li> -->
              <li>
                <h4>{{ affaire.name }}</h4>
              </li>
              <li>
                <h5>{{ affaire.tech_name }}</h5>
              </li>

              <li>
                <h5 class="taille">{{ affaire.tech_id }}</h5>
              </li>

              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.description)"
                  :class="affaire.description ? 'buttonv' : 'button'"
                ></button>
              </li>
              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.master_note)"
                  :class="affaire.master_note ? 'buttonv' : 'button'"
                ></button>
              </li>
              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.tech_note)"
                  :class="affaire.tech_note ? 'buttonv' : 'button'"
                ></button>
              </li>
            </ul>
            <div class="fiche2">
              {{
                format(new Date(affaire.return_date), "EEEE  MM ", {
                  locale: fr
                })
              }}

              <li class="date-s">
                {{ (affaire.return_time = morning ? "Matin" : "Ap-midi") }}
              </li>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- ---------------Tomorrow -------------------------------- -->

    <div class="tomorrow">
      <div v-if="isOpenAffSelect == 'tomorrow'" class="event-type">
        <h3 v-if="isTomorrow(new Date(affaire.prep_date))">Prépa</h3>
      </div>
      <div class="event-type" v-if="isOpenAffSelect == 'tomorrow'">
        <h3>Prépa</h3>
        <!-- {{ affaire.receipt_date }} -->
      </div>
      <div class="list-aff" v-for="affaire in affaires" :key="affaire.affairid">
        <div v-if="isOpenAffSelect == 'tomorrow'">
          <div v-if="isTomorrow(new Date(affaire.prep_date))">
            <ul class="content">
              <!-- <li>
                <input type="checkbox" />
              </li> -->
              <li>
                <h4>{{ affaire.name }}</h4>
              </li>
              <li>
                <h5>{{ affaire.tech_name }}</h5>
              </li>
              <li class="date-s">
                {{ (affaire.prep_time = morning ? "Matin" : "Ap-midi") }}
              </li>
              <!-- <li class="date-s">
                {{ format(new Date(affaire.receipt_date), "dd MM ") }}
              </li> -->
              <li>
                <h5 class="taille">{{ affaire.tech_id }}</h5>
              </li>

              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.description)"
                  :class="affaire.description ? 'buttonv' : 'button'"
                ></button>
              </li>
              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.master_note)"
                  :class="affaire.master_note ? 'buttonv' : 'button'"
                ></button>
              </li>
              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.tech_note)"
                  :class="affaire.tech_note ? 'buttonv' : 'button'"
                ></button>
              </li>
            </ul>
            <div class="fiche2">
              {{
                format(new Date(affaire.prep_date), "EEEE  MM ", {
                  locale: fr
                })
              }}
            </div>
          </div>
        </div>
      </div>
      <div v-if="isOpenAffSelect == 'tomorrow'" class="event-type">
        <h3>Sortie</h3>
        <!-- {{ affaire.receipt_date }} -->
      </div>
      <div class="list-aff" v-for="affaire in affaires" :key="affaire.affairid">
        <div v-if="isOpenAffSelect == 'tomorrow'">
          <div v-if="isTomorrow(new Date(affaire.receipt_date))">
            <ul class="content">
              <!-- <li>
                <input type="checkbox" />
              </li> -->
              <li>
                <h4>{{ affaire.name }}</h4>
              </li>
              <li>
                <h5>{{ affaire.tech_name }}</h5>
              </li>
              <li class="date-s">
                {{ (affaire.receipt_time = morning ? "Matin" : "Ap-midi") }}
              </li>
              <li>
                <h5 class="taille">{{ affaire.tech_id }}</h5>
              </li>

              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.description)"
                  :class="affaire.description ? 'buttonv' : 'button'"
                ></button>
              </li>
              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.master_note)"
                  :class="affaire.master_note ? 'buttonv' : 'button'"
                ></button>
              </li>
              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.tech_note)"
                  :class="affaire.tech_note ? 'buttonv' : 'button'"
                ></button>
              </li>
            </ul>
            <div class="fiche2">
              {{
                format(new Date(affaire.receipt_date), "EEEE  MM ", {
                  locale: fr
                })
              }}
            </div>
          </div>
        </div>
      </div>
      <div v-if="isOpenAffSelect == 'tomorrow'" class="event-type">
        <h3>Retour</h3>
        <!-- {{ affaire.receipt_date }} -->
      </div>
      <div class="list-aff" v-for="affaire in affaires" :key="affaire.affairid">
        <div v-if="isOpenAffSelect == 'tomorrow'">
          <div v-if="isTomorrow(new Date(affaire.return_date))">
            <ul class="content">
              <!-- <li>
                <input type="checkbox" />
                </li> -->
              <li>
                <h4>{{ affaire.name }}</h4>
              </li>
              <li>
                <h5>{{ affaire.tech_name }}</h5>
              </li>
              <li class="date-s">
                {{ (affaire.return_time = morning ? "Matin" : "Ap-midi") }}
              </li>
              <li>
                <h5 class="taille">{{ affaire.tech_id }}</h5>
              </li>

              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.description)"
                  :class="affaire.description ? 'buttonv' : 'button'"
                ></button>
              </li>
              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.master_note)"
                  :class="affaire.master_note ? 'buttonv' : 'button'"
                ></button>
              </li>
              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.tech_note)"
                  :class="affaire.tech_note ? 'buttonv' : 'button'"
                ></button>
              </li>
            </ul>
            <div class="fiche2">
              {{
                format(new Date(affaire.return_date), "EEEE  MM ", {
                  locale: fr
                })
              }}
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

      <div class="list-aff" v-for="affaire in affaires" :key="affaire.affairid">
        <div v-if="isOpenAffSelect == 'after'">
          <div
            v-if="after2() < affaire.prep_date && affaire.prep_date <= after5()"
          >
            <ul class="content">
              <!-- <li>
                <input type="checkbox" />
              </li> -->
              <li>
                <h4>{{ affaire.name }}</h4>
              </li>
              <li>
                <h5>{{ affaire.tech_name }}</h5>
              </li>
              <li class="date-s">
                {{ (affaire.prep_time = morning ? "Matin" : "Ap-midi") }}
              </li>
              <!-- <li class="date-s">
                {{ format(new Date(affaire.receipt_date), "dd MM ") }}
              </li> -->
              <li>
                <h5 class="taille">{{ affaire.tech_id }}</h5>
              </li>

              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.description)"
                  :class="affaire.description ? 'buttonv' : 'button'"
                ></button>
              </li>
              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.master_note)"
                  :class="affaire.master_note ? 'buttonv' : 'button'"
                ></button>
              </li>
              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.tech_note)"
                  :class="affaire.tech_note ? 'buttonv' : 'button'"
                ></button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div v-if="isOpenAffSelect == 'after'" class="event-type">
        <h3>Sortie</h3>
        <!-- {{ affaire.receipt_date }} -->
      </div>
      <div class="list-aff" v-for="affaire in affaires" :key="affaire.affairid">
        <div v-if="isOpenAffSelect == 'after'">
          <div
            v-if="
              after2() < affaire.receipt_date &&
                affaire.receipt_date <= after5()
            "
          >
            <ul class="content">
              <!-- <li>
                <input type="checkbox" />
              </li> -->
              <li>
                <h4>{{ affaire.name }}</h4>
              </li>
              <li>
                <h5>{{ affaire.tech_name }}</h5>
              </li>
              <li class="date-s">
                {{ (affaire.receipt_time = morning ? "Matin" : "Ap-midi") }}
              </li>
              <li>
                <h5 class="taille">{{ affaire.tech_id }}</h5>
              </li>

              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.description)"
                  :class="affaire.description ? 'buttonv' : 'button'"
                ></button>
              </li>
              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.master_note)"
                  :class="affaire.master_note ? 'buttonv' : 'button'"
                ></button>
              </li>
              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.tech_note)"
                  :class="affaire.tech_note ? 'buttonv' : 'button'"
                ></button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div v-if="isOpenAffSelect == 'after'" class="event-type">
        <h3>Retour</h3>
        <!-- {{ affaire.receipt_date }} -->
      </div>
      <div class="list-aff" v-for="affaire in affaires" :key="affaire.affairid">
        <div v-if="isOpenAffSelect == 'after'">
          <div
            v-if="
              after2() < affaire.return_date && affaire.return_date <= after5()
            "
          >
            <ul class="content">
              <!-- <li>
                <input type="checkbox" />
                </li> -->
              <li>
                <h4>{{ affaire.name }}</h4>
              </li>
              <li>
                <h5>{{ affaire.tech_name }}</h5>
              </li>
              <li class="date-s">
                {{ (affaire.return_time = morning ? "Matin" : "Ap-midi") }}
              </li>
              <li>
                <h5 class="taille">{{ affaire.tech_id }}</h5>
              </li>

              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.description)"
                  :class="affaire.description ? 'buttonv' : 'button'"
                ></button>
              </li>
              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.master_note)"
                  :class="affaire.master_note ? 'buttonv' : 'button'"
                ></button>
              </li>
              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.tech_note)"
                  :class="affaire.tech_note ? 'buttonv' : 'button'"
                ></button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <!-- -------------------  Futur ....... -------------------------->
    <div class="futur">
      <div v-if="isOpenAffSelect == 'futur'" class="event-type">
        <h3>Prépa</h3>
      </div>

      <div class="list-aff" v-for="affaire in affaires" :key="affaire.affairid">
        <div v-if="isOpenAffSelect == 'futur'">
          <div
            v-if="after2() < affaire.prep_date && affaire.prep_date <= after5()"
          >
            <ul class="content">
              <!-- <li>
                <input type="checkbox" />
              </li> -->
              <li>
                <h4>{{ affaire.name }}</h4>
              </li>
              <li>
                <h5>{{ affaire.tech_name }}</h5>
              </li>
              <li class="date-s">
                {{ (affaire.prep_time = morning ? "Matin" : "Ap-midi") }}
              </li>
              <!-- <li class="date-s">
                {{ format(new Date(affaire.receipt_date), "dd MM ") }}
              </li> -->
              <li>
                <h5 class="taille">{{ affaire.tech_id }}</h5>
              </li>

              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.description)"
                  :class="affaire.description ? 'buttonv' : 'button'"
                ></button>
              </li>
              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.master_note)"
                  :class="affaire.master_note ? 'buttonv' : 'button'"
                ></button>
              </li>
              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.tech_note)"
                  :class="affaire.tech_note ? 'buttonv' : 'button'"
                ></button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div v-if="isOpenAffSelect == 'futur'" class="event-type">
        <h3>Sortie</h3>
        <!-- {{ affaire.receipt_date }} -->
      </div>
      <div class="list-aff" v-for="affaire in affaires" :key="affaire.affairid">
        <div v-if="isOpenAffSelect == 'futur'">
          <div
            v-if="
              after2() < affaire.receipt_date &&
                affaire.receipt_date <= after5()
            "
          >
            <ul class="content">
              <!-- <li>
                <input type="checkbox" />
              </li> -->
              <li>
                <h4>{{ affaire.name }}</h4>
              </li>
              <li>
                <h5>{{ affaire.tech_name }}</h5>
              </li>
              <li class="date-s">
                {{ (affaire.receipt_time = morning ? "Matin" : "Ap-midi") }}
              </li>
              <li>
                <h5 class="taille">{{ affaire.tech_id }}</h5>
              </li>

              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.description)"
                  :class="affaire.description ? 'buttonv' : 'button'"
                ></button>
              </li>
              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.master_note)"
                  :class="affaire.master_note ? 'buttonv' : 'button'"
                ></button>
              </li>
              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.tech_note)"
                  :class="affaire.tech_note ? 'buttonv' : 'button'"
                ></button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div v-if="isOpenAffSelect == 'futur'" class="event-type">
        <h3>Retour</h3>
        <!-- {{ affaire.receipt_date }} -->
      </div>
      <div class="list-aff" v-for="affaire in affaires" :key="affaire.affairid">
        <div v-if="isOpenAffSelect == 'futur'">
          <div
            v-if="
              after2() < affaire.return_date && affaire.return_date <= after5()
            "
          >
            <ul class="content">
              <!-- <li>
                <input type="checkbox" />
                </li> -->
              <li>
                <h4>{{ affaire.name }}</h4>
              </li>
              <li>
                <h5>{{ affaire.tech_name }}</h5>
              </li>
              <li class="date-s">
                {{ (affaire.return_time = morning ? "Matin" : "Ap-midi") }}
              </li>
              <li>
                <h5 class="taille">{{ affaire.tech_id }}</h5>
              </li>

              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.description)"
                  :class="affaire.description ? 'buttonv' : 'button'"
                ></button>
              </li>
              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.master_note)"
                  :class="affaire.master_note ? 'buttonv' : 'button'"
                ></button>
              </li>
              <li>
                <button
                  type="button"
                  @click="modalOpen(affaire.tech_note)"
                  :class="affaire.tech_note ? 'buttonv' : 'button'"
                ></button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ModalDelete from "@/components/ModalDelete.vue";
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
import { ref, onMounted } from "vue";

export default {
  name: "MasterAffaire",
  components: { ModalDelete },
  setup() {
    let affaires = ref([]);
    let cables = ref([]);
    let affaire = ref([]);
    const morning = "";
    const isOpenNote = ref(false);
    const displayNote = ref("");

    function modalOpen(data) {
      displayNote.value = data;
      isOpenNote.value = true;
      console.log("countfc.value | data:", data);
    }

    // get affaire
    let affair_get = onMounted(() => {
      api
        .call("affair_get")
        .then(response => {
          affaires.value = response;
          console.log("affair_get:", response);
        })
        .catch(response => {
          console.log("err_affair_get:", response);
        });
    });

    // const affairToday = computed(() => {
    //   return affaires.value.filter(c => c.prep_date === today());
    // });
    // console.log("affairToday", affairToday);

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
      return format(new Date(), "yyyy-MM-dd", { locale: fr });
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
    //     return e1.affaire.prepa_date < e2.affaire.prepa_date ? 1 : -1;
    //   });
    // });

    // let unarchivedAffaires = computed(() => {
    //   return sortedAffaires.value.filter(e => !e.archived);
    // });

    return {
      addDays,
      add,
      affaires,

      after2,
      after5,
      // affairToday,
      affaire,

      cable_get,
      cables,
      affair_get,

      isAfter,
      isOpenNote,
      isOpenAffSelect,
      isOpenAff,
      isTomorrow,
      isToday,

      isYesterday,
      modalOpen,
      displayNote,
      format,
      formatRelative,
      subDays,
      // showIcon,
      today,
      tomorrow,
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
.date-s {
  width: 80px;
  margin: 0px 5px;
}
.event-type {
  display: flex;
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

.checkbox {
  border: 1px solid black;
  padding: 2px;
}
.clickable {
  cursor: pointer;
}
.content {
  /* border-bottom: 1px solid rgb(143, 138, 138); */
}
.fiche2 ul {
  display: flex;
  justify-content: space-between;
  width: 375px;
  /* align-items: center; */

  border-bottom: 1px solid black;
}
.list {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.list-aff ul {
  display: flex;
  align-items: center;
  height: 40px;
}
li {
  list-style: none;
  height: 20px;
  padding: 0px;
}
li button {
  margin-right: 10px;
  height: 20px;
  width: 20px;
}
li h4 {
  width: 150px;
  height: 15px;
  text-align: left;
  font-size: 14px;
  padding-bottom: 10px;
}
li h5 {
  width: 60px;
  text-align: center;
  overflow: hidden;
}
.main {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.taille {
  width: 20px;
  padding: 10px;
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

ul.contentt {
  height: 25px;
}
</style>
