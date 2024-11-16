const { query } = require("express");

function searchMedicine(value) {
    console.log(value)
    if (value.length > 0) {
      axios.get('/search-medicine', {
        params : {
          medicine: value
        }
      })
      .then(response => {
        console.log(response.data);
        if (response.data.length > 0) {
          response.data.map((item) => {
            document.getElementById('search-results').innerHTML = item.Medicine
          })
        }else{
          document.getElementById('search-results').innerHTML = ''
        }
        
        // Handle the response data here
      })
      .catch(error => {
        console.error(error);
      });
    }else{
      document.getElementById('search-results').innerHTML = ''
    }
  }
  