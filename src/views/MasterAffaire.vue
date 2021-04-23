<template
  ><div class="main">
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

    <div>
      <input type="text" placeholder="Qui l'utilise ?" />
    </div>
    <h1 @click="isOpenToday = !isOpenToday" class="titre-day">Aujourd'hui</h1>
    <div class="list-aff" v-for="affaire in affaires" :key="affaire.affairid">
      <div v-if="isOpenToday">
        <div v-if="affaire.prep_date === today()">
          <div class="event-type">
            <h3>Prépa</h3>
            <!-- {{ affaire.prep_date }} -->
          </div>
          <ul class="head-today">
            <li style="padding-left:9px">Desc</li>
            <li style="padding-left:8px">Tech</li>
            <li style="padding-left:8px">Atel</li>
          </ul>
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
        <!-- </div>
      <div class="list-aff" v-for="affaire in affaires" :key="affaire.affairid"> -->
        <div v-if="affaire.receipt_date === today()">
          <div class="event-type">
            <h3>Sortie</h3>
            <!-- {{ affaire.receipt_date }} -->
          </div>
          <ul class="head-today">
            <li style="padding-left:9px">Desc</li>
            <li style="padding-left:8px">Tech</li>
            <li style="padding-left:8px">Atel</li>
          </ul>
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
        <div v-if="affaire.return_date === today()">
          <div class="event-type">
            <h3>Retour</h3>
            <!-- {{ affaire.return_date }} -->
          </div>
          <ul class="head-today">
            <li style="padding-left:9px">Desc</li>
            <li style="padding-left:8px">Tech</li>
            <li style="padding-left:8px">Atel</li>
          </ul>
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
    <!-- --------------------------------------------------------- -->
    <h1 @click="isOpenTomorrow = !isOpenTomorrow" class="titre-day">Demain</h1>
    <div>
      <div v-if="affaire.prep_date === tomorrow()">
        <h3>Prépa</h3>
        <ul class="head-today">
          <li style="padding-left:30px">Technicien</li>
          <li style="padding-left:5px">=></li>
          <li style="padding-left:0px">Taille</li>
          <li style="padding-left:9px">Desc</li>
          <li style="padding-left:8px">Tech</li>
          <li style="padding-left:8px">Atel</li>
        </ul>
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

      <div v-if="affaire.receipt_date === tomorrow()">
        <h3>Sortie</h3>
        {{ affaire.receipt_date }}
        <ul class="head-today">
          <li style="padding-left:30px">Technicien</li>
          <li style="padding-left:5px">=></li>
          <li style="padding-left:0px">Taille</li>
          <li style="padding-left:9px">Desc</li>
          <li style="padding-left:8px">Tech</li>
          <li style="padding-left:8px">Atel</li>
        </ul>
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
      <div v-if="affaire.return_date === tomorrow()">
        <h3>Retour</h3>
        <ul class="head-today">
          <li style="padding-left:30px">Technicien</li>
          <li style="padding-left:5px">=></li>
          <li style="padding-left:0px">Taille</li>
          <li style="padding-left:9px">Desc</li>
          <li style="padding-left:8px">Tech</li>
          <li style="padding-left:8px">Atel</li>
        </ul>
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
  <!-- --------------------------------------------------------- -->
  <h1 @click="isOpen5Days = !isOpen5Days" class="titre-day">
    les 5 jours suivants
  </h1>
  <div class="list-aff" v-if="isOpen5Days">
    <ul class="head-today">
      <li>Affaire</li>
      <li style="padding-left:30px">Technicien</li>
      <li style="padding-left:5px">=></li>
      <li style="padding-left:0px">Taille</li>
      <li style="padding-left:9px">Desc</li>
      <li style="padding-left:8px">Tech</li>
      <li style="padding-left:8px">Atel</li>
    </ul>
    <ul v-for="affaire in affaires" :key="affaire.affairid" class="content">
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
        {{ format(new Date(affaire.receipt_date), "dd MM ") }}
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

  <div>
    <div class="main"></div>
  </div>
</template>

<script>
import ModalDelete from "@/components/ModalDelete.vue";
import { Api } from "../js/api.js";
var url = "https://cinod.fr/cables/api.php";
var api = new Api(url);
// import cablageServices from "@/services/cablage.js";
import { format, subDays, formatRelative, startOfTomorrow } from "date-fns";
import { fr, ru } from "date-fns/locale";
import { ref, onMounted } from "vue";

export default {
  name: "MasterAffaire",
  components: { ModalDelete },
  setup() {
    let affaires = ref([]);
    let cables = ref([]);
    let affaire = ref([]);
    const isOpenNote = ref(false);
    const displayNote = ref("");
    const isOpenToday = ref(true);
    const isOpenTomorrow = ref(false);
    const isOpen5Days = ref(false);

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
        locale: ru
      });
    }
    function today() {
      return format(new Date(), "yyyy-MM-dd", { locale: fr });
    }
    function tomorrow() {
      return format(new Date(), "yyyy-MM-dd", { locale: fr });
    }
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
      affaires,
      // affairToday,
      affaire,
      cable_get,
      cables,
      affair_get,
      isOpenNote,
      isOpenToday,
      isOpenTomorrow,
      isOpen5Days,
      modalOpen,
      displayNote,
      format,
      formatRelative,
      subDays,
      today,
      tomorrow,
      startOfTomorrow,
      fr,
      ru,
      getFormat
      // unarchivedAffaires,
      // sortedAffaires
    };
  }
};
</script>

<style scoped>
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
  width: 40px;
  margin: 0px 5px;
}
.event-type {
  display: flex;
}
.head-today {
  padding-left: 200px;
}

.checkbox {
  border: 1px solid black;
  padding: 2px;
}
.clickable {
  cursor: pointer;
}
.content {
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
  /* margin: 10px; */
  padding: 0px;
}
li button {
  margin-right: 10px;
  height: 20px;
  width: 20px;
}
li h4 {
  width: 100px;
  text-align: left;
  font-size: 14px;
  padding-bottom: 10px;
}
li h5 {
  width: 40px;
  text-align: center;
  overflow: hidden;
}

.tab-affaires {
  max-width: 1000px;
  margin: auto;
  border-collapse: collapse;
}
.tab-affaires td {
  border-bottom: 1px solid black;
  padding: 0px 5px;
  text-align: left;
}
.taille {
  width: 20px;
  padding: 10px;
}
tr {
  height: 25px;
}
.tab-affaires tr {
  height: 40px;
}
.titre-day {
  text-align: left;
}

.tab-affaires tr.done {
  background-color: rgb(235, 229, 229);
}
.tab-affaires tr.done {
  background-color: rgb(210, 221, 218);
}
ul.content {
  padding: 0px;
}
</style>
