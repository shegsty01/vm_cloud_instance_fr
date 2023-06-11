const { v4: uuidv4 } = require('uuid');
const  Collection = require('./Collections');// //233243313306
require('dotenv').config()
// //233243315035




const makePayment = async (price,number,message)=>{
    //:tagId req.params.tagId
  let payment = new Collection()
  let externalId = uuidv4()
  console.log(price,number,message)
  let paymentApiCall =  await payment.requestToPay(externalId,price,number,message)
  console.log(paymentApiCall)
  //if(payment.status == "201"){websokets?? setTimeout(apicall,20000) both frontend and bakend get status}
  let checkStatus =  await payment.getTransactionStatus()
  return checkStatus

}
  
 
  // return checkStatus
  //console.log(checkStatus)
  
  // res.send(checkStatus)
  // });
  
  // app.listen(port, () => {
  //   console.log(`[server]: Server is running at http://localhost:${port}`);
  // });
  
  module.exports = makePayment