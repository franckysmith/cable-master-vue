<template>
  <div v-for="cable in allCables" :key="cable.cableid">
    <form>
      <div class="number">
        <!-- <div>
          <input type="checkbox" v-model="cable.done" />
          {{ cable.done }}
        </div> -->
        <div class="name">
          <h4 :class="setColorIndicator">{{ cable.name }}</h4>
        </div>
        <p style="font-size:10px;line-height:1px">
          {{ calculateTotal(cable) }}
        </p>
        <div>
          <input
            name="spare_count"
            v-model.number="cable.spare_count"
            @click="cable.spare_count = parseInt(cable.spare_count || 0) + 1"
          />
        </div>

        <div>
          <input
            name=""
            v-model="cable.z1"
            @click="cable.z1 = parseInt(cable.z1 || 0) + 1"
          />
        </div>
        <div>
          <input
            class="z2"
            v-model="cable.z2"
            @click="cable.z2 = parseInt(cable.z2 || 0) + 1"
          />
        </div>
        <div>
          <input
            name=""
            v-model="cable.z3"
            @click="cable.z3 = parseInt(cable.z3 || 0) + 1"
          />
        </div>
        <div>
          <input
            name=""
            v-model="cable.z4"
            @click="cable.z4 = parseInt(cable.z4 || 0) + 1"
          />
        </div>
        <div>
          <input
            name=""
            v-model="cable.z5"
            @click="cable.z5 = parseInt(cable.z5 || 0) + 1"
          />
        </div>
        <div>
          <input name="" class="zoro" v-model="cable.count" />
        </div>

        <!-- <div>
          {{ calculateTotal(cable) }}
        </div> -->
      </div>
      <div class="info-content">
        <div class="info">
          <p>{{ cable.info }}</p>
          <button type="button" class="link" v-if="cable.link">
            <a href="cable.link" target="_blank">link</a>
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import { computed, ref } from "vue";
import { longClickDirective } from "vue-long-click";

export default {
  emits: ["lessontotalcable"],
  props: {
    cables: {
      type: Array
    },
    cableType: {
      type: String
    },
    showMyList: {
      type: Boolean
    },
    affaireSelected: {
      type: Array
    }
  },

  setup(props) {
    let allCables = ref([]);
    let cable = ref([]);
    // let calculateTotal = ref([]);

    // function validecount() {
    //   cable.value.count = calculateTotal(cable);
    //   console.log("totalcable", cable.value.count);
    // }

    function calculateTotal(cable) {
      return (
        parseInt(cable.z1 || 0) +
        parseInt(cable.z2 || 0) +
        parseInt(cable.z3 || 0) +
        parseInt(cable.z4 || 0) +
        parseInt(cable.z5 || 0) +
        parseInt(cable.spare_count || 0)
      );
    }

    allCables = computed(() => {
      if (props.showMyList) {
        return props.cables.filter(c => calculateTotal(c) > 0);
      }
      return props.cables;
    });

    let setColorIndicator = computed(() => {
      if (cable.value.z5 < 10) {
        return { rouge: true };
      } else if (cable.value.total < 5) {
        return { borderOrange: true };
      } else {
        return { borderVert: true };
      }
    });
    console.log("allCable.value.z5", cable.value.z5);

    // function setColorIndicator(cable) {
    //   if (cable.total > 10) {
    //     return "available-info";
    //   } else if (cable.total > 5) {
    //     return "available-warning";
    //   } else {
    //     return "available-alert";
    //   }
    // }

    return {
      calculateTotal,
      allCables,
      setColorIndicator,
      longClickDirective,
      cable
      // validecount
    };
  }
};
</script>

<style scoped>
input {
  padding: 5px;
}
.info-content {
  height: 14px;
  margin: 0px 0px 10px 0px;
  line-height: 0;
}
.info {
  font-size: 12px;
  width: 325px;
  height: 20px;
  display: flex;
  justify-content: space-between;
  text-align: left;
  /* padding: 0px; */
  margin: 0px 0px 5px 0px;
  font-style: italic;
  border-bottom: 1px solid;
}

.link {
  height: 18px;
  background: transparent;
  border: 1px solid grey;
  color: grey;
  /* line-height: 10; */
}

.name {
  height: 10px;
  width: 100px;
  cursor: pointer;
}
.name h4 {
  margin: 10px 30px 10px 0px;
  font-weight: 500;
  text-align: left;
  width: 110px;
  padding: 1px 1px 1px 3px;
  /* margin-left: 5px; */
  border-left: 5px solid #4dcc59;
  background-color: #c1c7c33a;
}
.border-vert {
  border-left: 5px solid #4dcc59;
}
.rouge {
  border-left: 5px solid red;
}
.border-orange {
  border-left: 5px solid #eb7405;
}
.number {
  display: flex;
  border-width: 0px 0px 1px 0px;
  align-content: flex-start;
}

.number input {
  width: 18px;
  margin: 5px;
}

.zoro {
  width: 18px !important;
  cursor: pointer;
  margin: 5px;
  color: red;
}
.post {
  display: flex;
  flex-direction: column;
  align-items: center;
}
form {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.z2 {
  background-color: rgb(248, 245, 245);
  border: 1px solid rgb(12, 12, 2);
}
</style>
