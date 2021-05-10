<template>
  <div v-for="cable in allCables" :key="cable.cableid">
    <form>
      <div class="number">
        <!-- <div>
          <input type="checkbox" v-model="cable.done" />
          {{ cable.done }}
        </div> -->
        <div class="name">
          <div :class="[setColorIndicator(cable), cable.color]">
            <h4>{{ cable.name }}</h4>
          </div>
        </div>

        <div style="font-size:10px;">
          Total:{{ calculateTotal(cable) }}<br />
          <!-- {{ cable.total }} -->
        </div>
        <div>
          <input
            class="input-btn"
            type="button"
            name="spare_count"
            v-model.number="cable.spare_count"
            @mousedown="
              cable.spare_count = parseInt(cable.spare_count || 0) + 1
            "
            v-longclick="() => changeValue({ cable, prop: 'spare_count' })"
          />
        </div>

        <div>
          <input
            class="input-btn"
            type="button"
            v-model="cable.z1"
            @mousedown="cable.z1 = parseInt(cable.z1 || 0) + 1"
            v-longclick="() => changeValue({ cable, prop: 'z1' })"
          />
        </div>
        <div>
          <input
            class="input-btn"
            type="button"
            v-model="cable.z2"
            @mousedown="cable.z2 = parseInt(cable.z2 || 0) + 1"
            v-longclick="() => changeValue({ cable, prop: 'z2' })"
          />
        </div>
        <div>
          <input
            class="input-btn"
            type="button"
            name=""
            v-model="cable.z3"
            @mousedown="cable.z3 = parseInt(cable.z3 || 0) + 1"
            v-longclick="() => changeValue({ cable, prop: 'z3' })"
          />
        </div>
        <div>
          <input
            class="input-btn"
            type="button"
            v-model="cable.z4"
            @mousedown="cable.z4 = parseInt(cable.z4 || 0) + 1"
            v-longclick="() => changeValue({ cable, prop: 'z4' })"
          />
        </div>
        <div>
          <input
            class="input-btn"
            type="button"
            name=""
            v-model="cable.z5"
            @mousedown="cable.z5 = parseInt(cable.z5 || 0) + 1"
            v-longclick="() => changeValue({ cable, prop: 'z5' })"
          />
        </div>
      </div>
      <div class="info-content">
        <div class="info">
          <p>{{ cable.info }}</p>

          <button type="button" class="link" v-if="cable.link">
            <a :href="cable.link" target="_blank">link</a>
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
  emits: ["listentotalcable"],
  name: "CableList",
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
    // affaireSelected: {
    //   type: Array
    // },
    arrCount: {
      type: Array
    }
  },
  directives: {
    longclick: {
      beforeMount(el, binding, vNode) {
        let delay = 400;
        let interval = 100;
        if (typeof binding.value !== "function") {
          const compName = vNode.context.name;
          let warn = `[longclick:] provided expression '${binding.expression}' is not a function, but has to be`;
          if (compName) {
            warn += `Found in component '${compName}' `;
          }
          console.warn(warn); // eslint-disable-line
        }
        let pressTimer = null;
        let pressInterval = null;
        const start = e => {
          if (e.type === "click" && e.button !== 0) {
            return;
          }
          if (pressTimer === null) {
            pressTimer = setTimeout(() => {
              if (interval && interval > 0) {
                pressInterval = setInterval(() => {
                  handler();
                }, interval);
              }
              handler();
            }, delay);
          }
        };
        // Cancel Timeout
        const cancel = () => {
          if (pressTimer !== null) {
            clearTimeout(pressTimer);
            pressTimer = null;
          }
          if (pressInterval) {
            clearInterval(pressInterval);
            pressInterval = null;
          }
        };
        // Run Function
        const handler = e => {
          binding.value(e);
        };
        ["mousedown", "touchstart"].forEach(e => el.addEventListener(e, start));
        ["click", "mouseout", "touchend", "touchcancel"].forEach(e =>
          el.addEventListener(e, cancel)
        );
      }
    }
  },

  setup(props, { emit }) {
    let allCables = ref([]);
    let cable = ref([]);

    // let calculateTotal = ref([]);
    emit("listentotalcable", calculateTotal(cable));
    // data is now an object with two properties: { cable, prop: 'tfc1' } or { cable, prop: 'tfc2' } ...
    function changeValue(data) {
      data.cable[data.prop] -= 1;
      if (data.cable[data.prop] < 0) {
        data.cable[data.prop] = 0;
      }
    }
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

    /* edw: function setColorIndicator(cable) {
      // console.log("CableList | setColorIndicator | cable!! ", cable);
      if (!cable) {
        return;
      }
      // console.log("cable keys", Object.keys(cable));
      // console.log("cable values", Object.values(cable));
      // console.log("cable total", Object.values(cable)[7]);

      // const cableTotal = +Object.values(cable)[7];
      const cableTotal = Number(Object.values(cable)[7]);
      const cableFromProps = props.arrCount.find(
        cable => cable.cableid === cable.cableid
      );
      if (!cableFromProps) {
        return;
      }
      const cableTotalUpdated = cableTotal - Number(cableFromProps.count);
      // console.log("cableTotalUpdated", cableTotalUpdated);
      // console.log("cableFromProps.count", cableFromProps.count);

      if (cableTotalUpdated > 20) {
        return "green";
      } else if (cableTotalUpdated > 12) {
        return "orange";
      } else if (cableTotalUpdated < 0) {
        return "red";
      } else {
        return "red";
      }
    }*/

    function setColorIndicator(cable) {
      if (!cable) return;

      const cableFromProps = props.arrCount.find(
        cable2 => cable.cableid == cable2.cableid // introduce cable2 to not interfere with cable
      );
      if (!cableFromProps) return;

      const cableTotalUpdated = +cable.total - +cableFromProps.count;
      console.log("arrCount!:", props.arrCount);
      console.log("cableFromProps.count", cableFromProps.count);
      console.log("cableTotalUpdated:", cableTotalUpdated);
      console.log("cable.total:", cable.total);

      if (cableTotalUpdated > 2 * cable.reserved) {
        return "green";
      } else if (cableTotalUpdated >= cable.reserved) {
        return "orange";
      } else if (cableTotalUpdated < 0) {
        return "red";
      } else {
        return "red";
      }
    }

    return {
      calculateTotal,
      allCables,
      setColorIndicator,
      longClickDirective,
      cable,
      changeValue
    };
  }
};
</script>

<style scoped>
.color1 {
  background-color: rgb(171, 223, 224);
}
.color2 {
  background-color: rgb(230, 134, 134);
}
.color3 {
  background-color: rgb(230, 224, 134);
}
.color4 {
  background-color: rgb(230, 134, 214);
}
.color5 {
  background-color: rgb(210, 243, 131);
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
  margin: 0px 0px 5px 0px;
  font-style: italic;
  border-bottom: 1px solid;
}
.input-btn {
  height: 28px;
  width: 40px;
  text-align: center;
  padding-right: 15px;
  border: 1px solid grey;
  -webkit-appearance: none;
  border-radius: 0;
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
  /* border-left: 5px solid #4dcc59; */
  background-color: #c1c7c33a;
}
.green {
  border-left: 5px solid #4dcc59;
}
.red {
  border-left: 5px solid red;
}
.orange {
  border-left: 5px solid #eb7405;
}
.number {
  display: flex;
  border-width: 0px 0px 1px 0px;
  align-content: flex-start;
}

.number input {
  width: 28px;
  margin: 3px;
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
