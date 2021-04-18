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

    <div>
      <input type="text" placeholder="Qui l'utilise ?" />
    </div>

    <h2></h2>

    <div class="list-aff">
      <h1>Aujourd'hui</h1>
      <ul class="head-today">
        <li>Nom de l'affaire</li>
        <li style="padding-left:75px">Technicien</li>
        <li style="padding-left:25px">Sortie</li>
        <li style="padding-left:0px">Taille</li>
        <li style="padding-left:0px">Desc</li>
        <li style="padding-left:0px">Tech</li>
        <li style="padding-left:0px">Atel</li>
      </ul>
      <ul v-for="affaire in affaires" :key="affaire.affairid" class="list-aff">
        <li>
          <input type="checkbox" />
        </li>
        <li>
          <h4>{{ affaire.name }}</h4>
        </li>
        <li>
          <h5>{{ affaire.tech_name }}</h5>
        </li>
        <li class="date-s">
          {{ format(new Date(affaire.receipt_date), "dd/ MM ") }}
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
  </div>
</template>

<script>
import ModalDelete from "@/components/ModalDelete.vue";
import { Api } from "../js/api.js";
var url = "https://cinod.fr/cables/api.php";
var api = new Api(url);
// import cablageServices from "@/services/cablage.js";
import { format } from "date-fns";
import { fr } from "date-fns/esm/locale";
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
      affaire,
      cable_get,
      cables,
      affair_get,
      isOpenNote,
      modalOpen,
      displayNote,

      fr
      // unarchivedAffaires,
      // sortedAffaires
    };
  },
  data() {
    return {
      format
    };
  },

  methods: {
    getFormat() {
      return this.format(new Date(), "dd MM", { locale: fr });
    }
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
  width: 60px;
}
.head-today {
  padding-left: 90px;
}
.list {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.list-aff ul {
  display: flex;

  align-items: center;
  height: 20px;
}
li {
  list-style: none;
  margin: 10px;
  padding: 0px;
}
li button {
  margin-right: 10px;
  height: 20px;
  width: 20px;
}
li h4 {
  width: 200px;
  text-align: left;
}
li h5 {
  width: 100px;
  text-align: left;
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
}
tr {
  height: 25px;
}
.tab-affaires tr {
  height: 40px;
}
.checkbox {
  border: 1px solid black;
  padding: 2px;
}
.clickable {
  cursor: pointer;
}

.tab-affaires tr.done {
  background-color: rgb(235, 229, 229);
}
.tab-affaires tr.done {
  background-color: rgb(210, 221, 218);
}
</style>
