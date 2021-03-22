import { createRouter, createWebHistory } from "vue-router";
import Cablemaster from "../views/Cablemaster.vue";
// import Affairmaster from "../views/Affairmaster.vue";
import Cabletech from "../views/Cabletech.vue";
import CaisseType from "../views/CaisseType.vue";

const routes = [
  {
    path: "/",
    name: "Cablemaster",
    component: Cablemaster
  },
  // {
  //   path: "/affairmaster",
  //   name: "Affairmaster",
  //   component: Affairmaster
  // },
  {
    path: "/cabletech",
    name: "Cabletech",
    component: Cabletech
  },
  {
    path: "/caissetype",
    name: "CaisseType",
    component: CaisseType
  },
  {
    path: "/about",
    name: "About",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/About.vue")
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
