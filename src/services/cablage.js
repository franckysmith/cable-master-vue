let cables = [];
let affaires = [];
let orders = [];
// let mfc = [];
let cablemfc = [];

import { Api } from "../js/api.js";

const url = "https://cinod.fr/cables/api.php";
const api = new Api(url);

export default {
  cableread,
  cableadd,
  cableupdate,
  cabledelete,
  affairereadtech,
  affairereadname,
  affairadd,
  affaireupdate,
  affairedelete,
  orderread,

  orderset,
  orderdelete,
  mfcadd,
  mfcread,
  mfcupdate,
  mfcdelete,
  cablemfcread
};

//---- 'cable_get' ----
function cableread() {
  api
    .call("cable_get")
    .then(function(response) {
      console.log("cablage |cable_get :response:", response);
      return cables;
    })
    .catch(response => {
      console.log("cable_get:", response);
    });
}

/*//---- 'cable_add' ----*/
async function cableadd(data) {
  //   let data = [
  //     {
  //       name: "do48",
  //       type: "microphone",
  //       total: 100
  //     },
  //     {
  //       name: "rs232",
  //       type: "speaker",
  //       total: 50
  //     }
  //   ];

  // api
  //   .call("cable_add", data)
  //   .then(function(response) {
  //     console.log("cable_add:", response);
  //   })
  //   .catch(response => {
  //     console.log("cable_add:", response);
  //   });
  try {
    const response = await api.call("cable_add", data);
    return { status: 201, msg: `Cable créé avec l'id ${response}` };
  } catch (err) {
    console.log("CATCH cable_add:", err);
    return { status: 500, msg: `Echec de création du cable` };
  }
}

/*//---- 'cable_update' ----*/
function cableupdate(data) {
  //   let data = [
  //     {
  //       cableid: 13, // put here real cableid that were added via 'cable_add', see it in 'cable' table in phpmyadmin
  //       name: "do50",
  //       type: "electrical",
  //       total: 50
  //     },
  //     {
  //       cableid: 14, // put here real cableid that were added via 'cable_add', see it in 'cable table in phpmyadmin
  //       name: "rs434",
  //       type: "microphone",
  //       total: 30
  //     }
  //   ];

  api
    .call("cable_update", data)
    .then(response => {
      console.log("cable_update:", response);
    })
    .catch(response => {
      console.log("cable_update:", response);
    });
}

/* //---- 'cable_delete' ----*/
function cabledelete(data) {
  /*// [ 13, 14 ] put here actual cable ids, see them in 'cable' table in phpmyadmin*/

  api
    .call("cable_delete", data)
    .then(response => {
      console.log("cable_delete:", response);
    })
    .catch(function(response) {
      console.log("cable_delete:");
      console.log(response);
    });
}

/*//---- 'affair_get_tech' ----*/
function affairereadtech(searchby) {
  // var searchby = {
  //   tech_id: 3,
  //   //name: 'Casino de Paris'
  // };

  api
    .call("affair_get", searchby)
    .then(function(response) {
      console.log("affair_get:");
      console.log(response);
      return affaires;
    })
    .catch(function(response) {
      console.log("affair_get:");
      console.log(response);
    });
}

/*//---- 'affair_get_name' ----*/
function affairereadname(searchby) {
  // var searchby = {
  //   //tech_id: 3,
  //   name: 'Casino de Paris'
  // };

  api
    .call("affair_get", searchby)
    .then(function(response) {
      console.log("affair_get:");
      console.log(response);
    })
    .catch(function(response) {
      console.log("affair_get:");
      console.log(response);
    });
}

/*//---- 'affair_add' ----*/
function affairadd(data) {
  //   var data = {
  //     tech_id: 32,
  //     tech_name: "John Smith",
  //     name: "Bolshoi Theater",
  //     prep_date: "2021-02-15",
  //     prep_time: "afternoon",
  //     receipt_date: "2021-02-17",
  //     return_date: "2021-02-18",
  //     monitor: true,
  //     stage: true
  //   };

  api
    .call("affair_add", data)
    .then(function(response) {
      console.log("affair_add:", response);
      return affaires;
    })
    .catch(function(response) {
      console.log("affair_add:", response);
    });
}

/*//---- 'affair_update' ----*/
async function affaireupdate(data) {
  //   var data = {
  //     affairid: 5, // put here actual affairid you want to update
  //     name: "Crocus Hall",
  //     prep_time: "morning"
  //   };

  // api
  //   .call("affair_update", data)
  //   .then(function(response) {
  //     console.log("affair_update:");
  //     console.log(response);
  //   })
  //   .catch(function(response) {
  //     console.log("affair_update:");
  //     console.log(response);
  //   });
  try {
    await api.call("affair_update", data);
    return { status: 200, msg: "Affaire mise à jour" };
  } catch (error) {
    console.log("affair_update error", error);
    return { status: 500, msg: `La mise à jour de l'affaire a échoué` };
  }
}

/*//---- 'affair_delete' ----*/
function affairedelete(data) {
  //   var data = {
  //     affairid: 5 // put here actual affairid you want to delete
  //   };

  api
    .call("affair_delete", data)
    .then(function(response) {
      console.log("affair_delete:", response);
    })
    .catch(function(response) {
      console.log("affair_delete:", response);
    });
}

/*//---- 'order_get' ----*/
function orderread() {
  // {
  //        cableid,
  //        affairid,
  //        tech_id,
  //        count,
  //        [done]: <is set to false if missing>
  //      },

  api
    .call("order_get")
    .then(function(response) {
      console.log("order_get:");
      console.log(response);
    })
    .catch(function(response) {
      console.log("order_get:");
      console.log(response);
    });
}

/*//---- 'order_set' ----*/
function orderset(data) {
  //        cableid,
  //        affairid,
  //        tech_id,
  //        count,
  //        [done]: <is set to false if missing>
  //      },

  api
    .call("order_set", data)
    .then(function(response) {
      console.log("order_set:", response);
      return orders;
    })
    .catch(function(response) {
      console.log("order_set:", response);
    });
}

/*//---- 'order_update' ----*/
// function orderupdate(data) {
//   api
//     .call("order_update", data)
//     .then(function(response) {
//       console.log("order_update:");
//       console.log(response);
//     })
//     .catch(function(response) {
//       console.log("order_update:");
//       console.log(response);
//     });
// }

/*//---- 'order_delete' ----*/
function orderdelete(data) {
  api
    .call("order_delete", data)
    .then(function(response) {
      console.log("order_delete:", response);
    })
    .catch(function(response) {
      console.log("order_delete:", response);
    });
}
//---- 'mfc_get' ----
function mfcread() {
  api
    .call("mfc_get")
    .then(response => {
      console.log("cablage |mfc_get response:", response);
      return response;
    })
    .catch(response => {
      console.log("mfc_get:", response);
    });
}
// --------'mfcadd-New-------*/
function mfcadd(data) {
  // Adds a new MFC to 'mfc' table.
  // Input:
  //    {
  //      name,
  //      [info],
  //      [tech_id],
  //      [affairid]
  //    }
  // Output:
  //    {
  //      mfcid: <id of just added MFC>
  //    }, or
  //    {
  //      error:  <error message if any field violates self::$FIELDS['mfc_add'] constraints or an MFC with same
  //              'name' already exists>
  //    }

  api
    .call("mfc_add", data)
    .then(function(response) {
      console.log("mfc_add:", response);
    })
    .catch(response => {
      console.log("mfc_add:", response);
    });
}
// -----------mfc_update ----------*/
function mfcupdate(data) {
  //   var data = {
  //     affairid: 5, // put here actual affairid you want to update
  //     name: "Crocus Hall",
  //     prep_time: "morning"
  //   };

  api
    .call("mfc_update", data)
    .then(response => {
      console.log("mfc_update:");
      console.log(response);
    })
    .catch(function(response) {
      console.log("mfc_update:");
      console.log(response);
    });
}
/*//---- mfc_delete' ----*/
function mfcdelete(data) {
  api
    .call("mfc_delete", data)
    .then(function(response) {
      console.log("mfc_delete:", response);
    })
    .catch(function(response) {
      console.log("mfc_delete:", response);
    });
}
//---- 'cablemfc_get' ----
function cablemfcread() {
  api
    .call("cablemfc_get")
    .then(function(response) {
      console.log("cablage |cablemfc_get :response:", response);
      return cablemfc;
    })
    .catch(response => {
      console.log("cablemfc_get:", response);
    });
}
