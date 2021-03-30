<template>
  <div class="main">
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
            class="button"
            @click="newAffairOpen"
            value="New"
            type="button"
          >
            New
          </button>
          <!-- <option selected disabled>Sélectionner :</option> -->
          <select
            v-model="affaireSelectedId"
            @change="selectedaff(affaireSelectedId)"
            id="selectaff"
          >
            <option
              v-for="affairere in affaireSelectedTech"
              :key="affairere.affairid"
              :value="affairere"
              placeholder="choisir"
              >{{ affairere.name }}
            </option>
          </select>
        </li>
      </ul>
    </div>

    <form
      @submit.prevent="update_affair(affaire.affairid)"
      v-for="affaire in search"
      :key="affaire.affairid"
    >
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
        <div>
          <button @click="description = true" v-if="!description">
            description
          </button>
          <button
            @click="description = false"
            v-if="description"
            :style="closebuton"
          >
            description
          </button>
        </div>
        <div class="label">
          <div><p>matin</p></div>
          <div style="margin-left:20px"><p>ap-midi</p></div>
        </div>
      </div>

      <div class="content-dates">
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
          <input
            class="tech-name"
            v-model="affaire.tech_name"
            type="text"
            placeholder="Nom du technicien"
          />

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
            <button @click="note = true" v-if="!note">note =></button>
            <button @click="note = false" v-if="note" :style="closebutton">
              note =>
            </button>
            <button @click="notemaster = true" v-if="!notemaster">
              Atelier
            </button>
            <button @click="notemaster = false" v-if="notemaster">
              Atelier
            </button>
            <button
              id="save-affair"
              @click="update_affair(affaire)"
              class="button"
              type="submit"
            >
              Enregistrer
            </button>
            <span class="message">{{ message }}</span>
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
          <div>
            <label for="update"
              >Update le:
              <input
                v-model="affaire.timestamp"
                style="width:150px"
                type="timestamp"
                name="update"
            /></label>
          </div>
        </div>
      </div>
      <div v-if="description">
        <h4>Description</h4>
        <button
          @click="description = false"
          v-if="description"
          :class="closebuton"
        >
          fermer
        </button>
        <textarea
          cols="50"
          rows="10"
          v-model.lazy="affaire.description"
          placeholder="Noter ici une liste ds amplis et enceintes ...."
        ></textarea>
      </div>
      <div v-if="notemaster">
        <h4>Atelier => Technicien</h4>
        <button
          @click="notemaster = false"
          v-if="notemaster"
          :class="closebuton"
        >
          Fermer
        </button>
        <textarea
          cols="50"
          rows="10"
          v-model.lazy="affaire.master_note"
          placeholder="Noter ici une liste des amplis et enceintes optionel biensur mais cela peut être un aide mémoire...."
        ></textarea>
      </div>

      <div v-if="note">
        <h4>Technicien => Atelier</h4>
        <button @click="note = false" v-if="note" :style="closebutton">
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
  </div>
</template>

<script>
import { ref, computed, onBeforeMount } from "vue";
import { Api } from "../js/api.js";
const url = "https://cinod.fr/cables/api.php";
const api = new Api(url);

import cablageServices from "@/services/cablage.js";

export default {
  name: "Formaffaire",
  props: ["cables"],
  emit: ["lesson-open-newaff", "lesson-affaire"],
  setup(props, context) {
    let affaire = ref([]);
    let affaires = ref([]);

    // function affair techSelected button to change technician => liste d'affaires

    // let newAffairOpen = ref(false);
    let searchby = ref([]);
    let affaireSelect = ref([]);
    let affaireSelectedId = ref([]);
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

    onBeforeMount(() => {
      techSelected();
    });

    function newAffairOpen() {
      newAffairIsOpen.value = true;
      console.log("newAffairIsOpen", newAffairIsOpen.value);
      context.emit("lesson-open-newaff", newAffairIsOpen.value);
    }

    console.log("emit | newAffairopen ", newAffairIsOpen.value);
    // get affair by techid
    function techSelected(param) {
      let searchby = { tech_id: param };

      api
        .call("affair_get", searchby)
        .then(response => {
          affaireSelectedTech.value = response;
        })
        .catch(response => {
          console.log("affair_get:", response);
        });
    }
    //lz1 ...lz2 lfc1 ...lfc2 Label zone et flightcase
    // context.emit("lesson-affaire", affaire);

    // emit vers views/Cabletech
    function selectedaff(data) {
      context.emit("lessonaffaire", data);
      // console.log("selectedaff", data);
    }
    // update affair
    async function update_affair(param) {
      console.log("formaffair | affairupdate", param);
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

    // add affair
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
        return t.affairid.includes(affaireSelectedId.value.affairid);
      });
    });

    return {
      searchby,
      selectAffaire,
      techSelected,
      update_affair,
      add_affair,
      affaireSelectedId,
      affaireSelected,
      affaireSelectedTech,
      affaires,
      affaire,
      description,
      search,
      affaireSelect,
      selectedaff,
      newAffairOpen,
      notemaster,
      note,
      message
    };
  }
};
</script>

<style>
.button {
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
  background: #dde0de;
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
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
  line-height: 0px;
}
/* .content-dates input[type="radio"]:checked {
  background: #135806;
} */
.dates {
  padding: 0px;
  align-items: baseline;
  display: flex;
  justify-content: space-evenly;
  width: 400px;
}
.date-size {
  width: 120px;
}
.description {
  margin: 3px 0px 0px 32px;
  display: flex;
}
.entete {
  display: flex;
  justify-content: space-around;
  width: 400px;
  margin: auto;
  align-items: baseline;
}

.entete-name-aff {
  width: 200px;
  height: 32px;
  /* left: 34px; */
  /* top: 63px; */

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
  width: 400px;
}
input {
  padding: 5px;
}
.label {
  display: flex;
  margin-left: 155px;
  /* padding: 10px; */
}
li {
  list-style: none;
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
  margin-bottom: 15px;
}
.search-tech-aff select {
  margin-bottom: 15px;
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
