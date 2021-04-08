<template>
  <div class="main" v-for="cable in allCables" :key="cable.cableid">
    <div>
      <div class="number">
        <div class="name">
          <h4>{{ cable.name }}</h4>
        </div>

        <div class="countfc" :class="setColorIndicator(cable)">
          <p>
            <!-- {{ calculateTotal(cable) }} -->
            {{
              count - cable.tfc1 ||
                0 - cable.tfc2 ||
                0 - cable.tfc3 ||
                0 - cable.tfc4 ||
                0 - cable.tfc5 ||
                0
            }}
          </p>
        </div>

        <input
          name="tfc1"
          v-model="cable.tfc1"
          @click="cable.tfc1 = parseInt(cable.tfc1 || 0) + 1"
        />

        <input
          name="tfc2"
          v-model="cable.tfc2"
          @click="cable.tfc2 = parseInt(cable.tfc2 || 0) + 1"
        />

        <input
          id="tfc3"
          name="tfc3"
          v-model="cable.tfc3"
          @click="cable.tfc3 = parseInt(cable.tfc3 || 0) + 1"
        />

        <input
          name="tfc4"
          v-model="cable.tfc4"
          @click="cable.tfc4 = parseInt(cable.tfc4 || 0) + 1"
        />

        <input
          name="tfc5"
          v-model="cable.tfc5"
          @click="cable.tfc5 = parseInt(cable.tfc5 || 0) + 1"
        />
      </div>
    </div>
  </div>
</template>
<script>
import { computed, ref } from "vue";

export default {
  name: "FlightCaseManagement",
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
    let count = ref("");

    function calculateTotal(cable) {
      return (
        parseInt(cable.count) -
        parseInt(cable.tfc1 || 0) -
        parseInt(cable.tfc2 || 0) -
        parseInt(cable.tfc3 || 0) -
        parseInt(cable.tfc4 || 0) -
        parseInt(cable.tfc5 || 0)
      );
    }
    function setColorIndicator(cable) {
      if (cable.total > 10) {
        return "available-info";
      } else if (cable.total > 5) {
        return "available-warning";
      } else {
        return "available-alert";
      }
    }

    allCables = computed(() => {
      console.log("allCables::", allCables);
      if (props.showMyList) {
        return props.cables.filter(c => calculateTotal(c) > 0);
      }
      return props.cables;
    });

    return {
      calculateTotal,
      allCables,
      count,
      setColorIndicator
    };
  }
};
</script>

<style scoped>
.countfc {
  margin-right: 10px;
}
.countfc p {
  /* line-height: 10px; */
  padding-top: 5px;
  border: 1px solid black;
  background: rgb(224, 222, 222);
  width: 23px;
  height: 20px;
}
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
  margin: 0px 0px 5px 30px;
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
.main {
  margin: 0px;
  padding: 0px;
}

.name h4 {
  /* margin: 10px 0px; */
  font-weight: 500;
  text-align: left;
  width: 100px;
  padding: 1px 1px 1px 3px;
  /* margin-left: 5px; */
  background-color: #c1c7c33a;
  border-left: 5px solid #4dcc59;
}
.number {
  display: flex;
  border-width: 0px 0px 1px 0px;
  /* align-content: flex-start; */
  align-items: center;
  padding: 0px;
}

.number input {
  width: 15px;
  margin: 5px;
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
#tfc3 {
  background-color: rgb(248, 245, 245);
  border: 1px solid rgb(12, 12, 2);
}
</style>
