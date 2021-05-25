<template>
  <div id="nav">
    <router-link to="/Cablemaster">Cablemaster</router-link> |
    <router-link to="/MasterAffaire">MasterAffaire</router-link> |
    <router-link to="/CaisseType">CaisseType</router-link> |
    <router-link to="/about">About</router-link> |
    <router-link to="/">CableTech</router-link>
  </div>
  <router-view />
</template>

<style>
/* * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
} */
:root {
  --color1: #4dcc59;
  --color2: #f3e309;
  --color3: #eb910a;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 0px;
  padding-top: 20px;
}
.input,
select {
  font-size: 100%;
}

#nav {
  margin: auto;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #4dcc59;
}
/*** iPhone and iOS Form Input Zoom Fixes ***/
/* Fix Input Zoom on devices older than iPhone 5: */
/* @media screen and (device-aspect-ratio: 2/3) {
  select,
  textarea,
  input[type="text"],
  input[type="password"],
  input[type="datetime"],
  input[type="datetime-local"],
  input[type="date"],
  input[type="month"],
  input[type="time"],
  input[type="week"],
  input[type="number"],
  input[type="email"],
  input[type="url"] {
    font-size: 16px;
  }
} */

/* Fix Input Zoom on iPhone 5, 5C, 5S, iPod Touch 5g */
/* @media screen and (device-aspect-ratio: 40/71) {
  select,
  textarea,
  input[type="text"],
  input[type="password"],
  input[type="datetime"],
  input[type="datetime-local"],
  input[type="date"],
  input[type="month"],
  input[type="time"],
  input[type="week"],
  input[type="number"],
  input[type="email"],
  input[type="url"] {
    font-size: 16px;
  }
} */

/* Fix Input Zoom on iPhone 6, iPhone 6s, iPhone 7  */
/* @media screen and (device-aspect-ratio: 375/667) {
  select,
  textarea,
  input[type="text"],
  input[type="password"],
  input[type="datetime"],
  input[type="datetime-local"],
  input[type="date"],
  input[type="month"],
  input[type="time"],
  input[type="week"],
  input[type="number"],
  input[type="email"],
  input[type="tel"],
  input[type="url"] {
    font-size: 16px;
  }
} */

/* Fix Input Zoom on iPhone 6 Plus, iPhone 6s Plus, iPhone 7 Plus, iPhone 8, iPhone X, XS, XS Max  */
/* @media screen and (device-aspect-ratio: 9/16) {
  select,
  textarea,
  input[type="text"],
  input[type="password"],
  input[type="datetime"],
  input[type="datetime-local"],
  input[type="date"],
  input[type="month"],
  input[type="time"],
  input[type="week"],
  input[type="number"],
  input[type="email"],
  input[type="tel"],
  input[type="url"] {
    font-size: 16px;
  }
} */

/* """""""""""""""""""""""""""""""""""""""""""""""""""""" GENERAL MEDIAS QUERIES """"""""""""""""""""""""""""""""""""""""""""""""" */
/* Extra small devices (phones, 600px and down) */
/* @media only screen and (max-width: 600px) {
} */
/* Small devices (portrait tablets and large phones, 600px and up) */
/* @media only screen and (min-width: 600px) {
} */
/* Medium devices (landscape tablets, 768px and up) */
/* @media only screen and (min-width: 768px) {
} */
/* Large devices (laptops/desktops, 992px and up) */
/* @media only screen and (min-width: 992px) {
} */
/* Extra large devices (large laptops and desktops, 1200px and up) */
/* @media only screen and (min-width: 1200px) {
} */
</style>
