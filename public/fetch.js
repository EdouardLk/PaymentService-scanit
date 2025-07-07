let button = document.querySelector("#checkout-button");
console.log(button)

button.addEventListener('click' ,()=>{

    payment('http://localhost:9000/create-checkout-session')
});

/**
 * 
 * @param {*} url 
 * @param {*} data 
 * @returns 
 */
async function payment(url, data){

    // let donnees = {
    //     product : credits,
    //     quantity : 100,
    // };
    // Les options par défaut sont indiquées par *
    const response = await fetch(url, {
      method: "POST", //
      headers: {
        "Content-Type": "application/json",
      },
      
      //body: JSON.stringify((data == undefined) ? donnees : data), // le type utilisé pour le corps doit correspondre à l'en-tête "Content-Type"
    });   
    return response.json(); // transforme la réponse JSON reçue en objet JavaScript natif
            
};

// payment("https://localhost:4242/", { solution: 42 }).then((donnees) => {
//   console.log(donnees); // Les données JSON analysées par l'appel `donnees.json()`
// });
