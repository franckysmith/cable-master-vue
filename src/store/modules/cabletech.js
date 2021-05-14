// import { createCommentVNode } from "@vue/runtime-core";

export default {
  state: () => ({
    cables: [],
    arrcount: [],
    ingeson: "franck"
  }),
  mutations: {
    SET_CABLES(state, payload) {
      state.cables = payload;
    },
    SET_ARRCOUNT(state, payload) {
      state.arrcount = payload;
    }
  },
  actions: {
    setCables({ commit }, payload) {
      commit("SET_CABLES", payload);
    },
    setArrCount({ commit }, payload) {
      commit("SET_ARRCOUNT", payload);
    }
  },
  getters: {
    getCableCount(state) {
      return `Il y a ${state.cables.length} cable${
        state.cables.length > 1 ? "s" : ""
      }`;
    },
    getCableName(state) {
      return `${state.arrcount.length}`;
    }
  }
};
