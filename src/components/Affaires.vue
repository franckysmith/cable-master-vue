<template>
  <ModalDelete @close="isOpen = false" v-if="isOpen">
    <template v-slot:main>
      <div v-for="affaire in search" :key="affaire.affairid">
        <h1>{{ affToDelete.name }}</h1>
        <button
          class="modal-default-button"
          @click="delete_affair(affToDelete)"
        >
          supprimer
        </button>
      </div>
    </template>
    <template #footer>
      <button class="buttonv" @click="isOpenClose">
        non
      </button>
    </template>
  </ModalDelete>

  <div class="search-tech-aff">
    <ul>
      <li style="display flex,padding:10px">
        <button @click="techSelected(135)">John</button>
        <button @click="techSelected(3)">Edward</button>
        <button @click="techSelected(32)">francky</button>
        <button @click="techSelected()">All</button>
      </li>
      <li>
        <!-- /* ouverture component AddAffair*/ -->
        <button
          class="buttonv"
          @click="newAffairOpen"
          value="New"
          type="button"
        >
          New
        </button>
        <!-- <option selected disabled>Sélectionner :</option> -->
        <select
          v-model="affaireSelectedObject"
          @change="selectedaff(affaireSelectedObject)"
          id="selectaff"
          ><option value="" selected disabled>Choose</option>
          <option
            v-for="affaire in affaireSelectedTech"
            :key="affaire.affairid"
            :value="affaire"
            >{{ affaire.name }}
          </option>
        </select>
        <div id="teltechname"></div>
      </li>
    </ul>
  </div>

  <form
    @submit.prevent="update_affair(affaire.affairid)"
    v-for="affaire in search"
    :key="affaire.affairid"
  >
    <div style="margin:5px">
      <input
        class="tech-name"
        v-model="affaire.tech_name"
        type="text"
        placeholder="Nom du technicien"
      />
    </div>

    <div class="entete">
      <input
        class="entete-name-aff"
        v-model="affaire.name"
        placeholder="Nom de l'affaire"
      />
      <label for=""
        >Ref:
        <input
          v-model="affaire.ref"
          class="entete-ref_aff"
          placeholder="Référence"
      /></label>
    </div>

    <div class="description">
      <button @click="description = true" v-if="!description" class="button">
        description
      </button>
      <button @click="description = false" v-if="description" class="button3">
        description
      </button>
      <button type="button" @click="deleteAff(affaire)" class="button">
        Supprimer l'affaire
      </button>
    </div>

    <div class="content-dates">
      <div class="label">
        <div><p>matin</p></div>
        <div style="margin-left:13px"><p>ap-midi</p></div>
      </div>
      <div class="dates">
        <h4>Prépa</h4>

        <input
          class="date-size"
          v-model="affaire.prep_date"
          type="date"
          name="retour"
        />

        <input
          class="radio"
          v-model="affaire.prep_time"
          value="morning"
          type="radio"
          name="prepmoment"
        />
        <input
          class="radio"
          v-model="affaire.prep_time"
          value="afternoon"
          type="radio"
          name="prepmoment"
        />
      </div>
      <div class="dates">
        <h4>Sortie</h4>

        <input
          class="date-size"
          v-model="affaire.receipt_date"
          type="date"
          name="sortie"
        />
        <input
          class="radio"
          v-model="affaire.receipt_time"
          value="morning"
          type="radio"
          name="smoment"
        />

        <input
          class="radio"
          v-model="affaire.receipt_time"
          value="afternoon"
          type="radio"
          name="smoment"
        />
      </div>
      <div class="dates">
        <h4>Retour</h4>

        <input
          class="date-size"
          v-model="affaire.return_date"
          type="date"
          name="retour"
        />

        <input
          class="radio"
          v-model="affaire.return_time"
          value="morning"
          type="radio"
          name="rmoment"
        />
        <input
          class="radio"
          v-model="affaire.return_time"
          value="afternoon"
          type="radio"
          name="rmoment"
        />
      </div>
    </div>

    <div class="cont_2">
      <div class="tech">
        <label for="face">face</label>
        <input
          class="radio"
          v-model="affaire.front"
          :true-value="1"
          :false-value="0"
          type="checkbox"
          name="face"
        />
        <label for="mon"> monitor</label>
        <input
          class="radio"
          v-model="affaire.monitor"
          :true-value="1"
          :false-value="0"
          type="checkbox"
          name="mon"
        />
        <label for="scene"> scène</label>
        <input
          class="radio"
          v-model="affaire.stage"
          :true-value="1"
          :false-value="0"
          type="checkbox"
          name="scene"
        />
      </div>
      <div class="contentUpdate">
        <div class="content-update1">
          <button @click="note = true" v-if="!note" class="button">
            note =>
          </button>
          <button @click="note = false" v-if="note" class="button3">
            note =>
          </button>
          <button @click="notemaster = true" v-if="!notemaster" class="button">
            Atelier
          </button>
          <button @click="notemaster = false" v-if="notemaster" class="button3">
            Atelier
          </button>
          <button @click="update_affair(affaire)" class="button2" type="submit">
            Enregistrer {{ showMessage }}
          </button>

          <label for="end"
            >en ligne
            <input
              class="radio"
              v-model="affaire.done"
              type="checkbox"
              :true-value="1"
              :false-value="0"
              name="end"
          /></label>
        </div>

        <!-- <div class="date" name="update" style="width:350px">
          <label for="update">Mise à jour le: {{ today(affaire) }} </label>
        </div> -->
      </div>
    </div>
    <div v-if="description">
      <h4>Description</h4>
      <button @click="description = false" v-if="description" class="button3">
        fermer
      </button>
      <textarea
        cols="50"
        rows="5"
        v-model.lazy="affaire.description"
        placeholder="Noter ici pour mémoire une liste des amplis et enceintes utilisés...."
      ></textarea>
    </div>
    <div v-if="notemaster">
      <h4>Atelier => Technicien</h4>
      <button @click="notemaster = false" v-if="notemaster" class="button3">
        Fermer
      </button>

      <div class="atelier">
        <p>{{ affaire.master_note }} Réponse de l'atelier :</p>
      </div>
    </div>

    <div v-if="note">
      <h4>Technicien => Atelier</h4>
      <button @click="note = false" v-if="note" class="button3">
        fermer
      </button>
      <textarea
        cols="50"
        rows="10"
        v-model.lazy="affaire.tech_note"
        placeholder="Laisser ici un message pour l'atelier piles etc ...."
      ></textarea>
    </div>
  </form>
</template>

<script>
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import ModalDelete from "@/components/ModalDelete.vue";
import { ref, computed, onBeforeMount } from "vue";
import { Api } from "../js/api.js";
const url = "https://cinod.fr/cables/api.php";
const api = new Api(url);

import cablageServices from "@/services/cablage.js";

export default {
  name: "Affaires",
  components: { ModalDelete },
  props: ["cables"],
  emits: [
    "listenopennewaff",
    "lesson-affaire",
    "listenaffairelabel",
    "listenaffaire",
    "updateaffair"
  ],
  setup(props, context) {
    let affaire = ref([]);
    let affaires = ref([]);
    let searchby = ref([]);
    const return_time = ref("afternoon");
    let affaireSelect = ref([]);
    let affaireSelectedObject = ref([]);
    let affaireSelectedTech = ref([]);
    let affaireSelected = ref([]);
    let selectAffaire = ref([]);
    let note = ref(false);
    let description = ref(false);
    let notemaster = ref("");
    let newAffairIsOpen = ref(false);
    let tech_id = ref("");
    let tech_name = ref("");
    let name = ref("");
    let message = ref("");
    const affToDelete = ref([]);
    const isOpen = ref(false);

    onBeforeMount(() => {
      techSelected();
    });

    // -----------Today -------------
    function today(data) {
      return format(new Date(data.timestamp), " EEEE dd MMMM / hh:mm ", {
        locale: fr
      });
    }

    function newAffairOpen() {
      newAffairIsOpen.value = true;
      // console.log("newAffairIsOpen", newAffairIsOpen.value);
      context.emit("listenopennewaff", newAffairIsOpen.value);
    }

    console.log("emit | newAffairopen ", newAffairIsOpen.value);
    // get affair by techid
    function techSelected(param) {
      api
        .call("affair_get", { tech_id: param })
        .then(response => {
          affaireSelectedTech.value = response;
        })
        .catch(response => {
          console.log("affair_get:", response);
        });
    }

    // emit vers views/Cabletech
    function selectedaff(affair) {
      context.emit("listenaffaire", affair);
      context.emit("listenaffairelabel", affair);
      // techSelected(affair);
    }

    // ----------- delete une affair
    function deleteAff(data) {
      affToDelete.value = data;
      isOpen.value = true;
    }

    function delete_affair(data) {
      console.log("Formaffaire | delete_affair()", data);
      cablageServices.affairedelete({ affairid: data.affairid });
      affaireSelectedTech.value = [""];
    }

    // --------------- update affair

    function update_affair(param) {
      context.emit("updateaffair", param);
      // console.log("formaffair | affairupdate", param);
      //   const res = await cablageServices.affaireupdate(param);
      //   console.log("res", res);
      //   showMessage(res.msg);
      // }
      // function showMessage(text) {
      //   message.value = text;
      //   setTimeout(() => {
      //     message.value = "";
      //   }, 3000);
    }

    // ------------- add affair
    function add_affair() {
      affaire.value = [""];
      let firstadd = {
        tech_id: tech_id.value,
        tech_name: tech_name.value,
        name: name.value
      };
      console.log("Formaffaire |add_affair", firstadd);
      cablageServices.affaireadd(firstadd);
    }

    // select affairid par technicien v-for in search
    let search = computed(() => {
      return affaireSelectedTech.value.filter(t => {
        return t.affairid === affaireSelectedObject.value.affairid;
      });
    });

    return {
      affaireSelectedObject,
      affaireSelected,
      affaireSelectedTech,
      affaires,
      affaire,
      affaireSelect,
      affToDelete,
      add_affair,
      delete_affair,
      deleteAff,
      format,
      fr,
      description,
      isOpen,
      newAffairOpen,
      notemaster,
      note,
      message,
      return_time,
      search,
      selectedaff,
      searchby,
      selectAffaire,
      today,
      techSelected,
      update_affair
    };
  }
};
</script>

<style scoped>
.atelier {
  height: 170px;
  width: 370px;

  border: 1px solid black;
}
.button {
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: #dce0dd;
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
.buttonv {
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: #4dcc59;

  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
.button2 {
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: #f3e309;
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
.button3 {
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: #eb910a;
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
button[type="submit"]:active {
  transform: scale(1.1);
  transition: 0.5s;
}
button {
  cursor: pointer;
}
.closebutton {
  background: #e08d8d;
}

.cont_2 {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.cont_2 input {
  margin: 5px;
}
.content-update1 {
  display: flex;
  justify-content: space-around;
  align-items: baseline;
}
.content-dates {
  margin-top: 10px;
  margin-bottom: 5px;
  padding-bottom: 5px;
  line-height: 0px;
  border: 1px solid rgb(160, 157, 157);
  width: 360px;
}
/* .content-dates input[type="radio"]:checked {
  background: #135806;
} */
.dates {
  padding: 0px;
  align-items: baseline;
  display: flex;
  justify-content: space-evenly;
  width: 365px;
}
.date-size {
  width: 120px;
}
.description {
  justify-content: space-evenly;
  margin: 3px 0px 0px 0px;
  display: flex;
}
.dess-supp {
  display: flex;
  height: 20px;
}
.entete {
  display: flex;
  justify-content: space-between;
  width: 365px;
}
.entete-name-aff {
  width: 200px;
  height: 32px;
  background: linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0) 100%);
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
}
.entete-ref_aff {
  width: 80px;
  margin: 6px;

  background: linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0) 100%);
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
}
form {
  display: flex;
  flex-direction: column;
  align-items: center;

  margin: auto;
}
input {
  padding: 5px;
}
input[type="checkbox"] {
  cursor: pointer;
}
.label {
  display: flex;
  margin-left: 250px;
  /* padding: 10px; */
}
li {
  list-style: none;
}
ul {
  width: 365px;
  margin: auto;
}
.main {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.message {
  font-size: 10px;
}

.note-description {
  display: inline-flex;
  height: 40px;
}
.search-tech-aff li {
  margin: 15px;
}
.search-tech-aff select {
  margin: 0px 15px 5px 0px;
}
.tech-name {
  width: 120px;
}

ul {
  padding-inline-start: 0px;
}
#selectaff {
  width: 130px;
}
#save-affair {
  background-color: rgb(240, 216, 2);
  color: #0c0b0b;
  font-weight: 600;
  box-shadow: 5px 7px 5px 0px rgba(143, 141, 141, 0.75);
  -webkit-box-shadow: 5px 7px 5px 0px rgba(143, 141, 141, 0.75);
  -moz-box-shadow: 5px 7px 5px 0px rgba(143, 141, 141, 0.75);
}
</style>
