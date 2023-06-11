"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
dotenv_1.default.config();
class Collection {
    //
    constructor() {
        this.clientId = process.env.API_USER_LIVE_COLLECTIONS;
        this.clientSecret = process.env.API_KEY_LIVE_COLLECTIONS;
        this.auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
        this.callbackUri = process.env.PORT;
        this.tokenURI = process.env.COLLECTION_TOKEN_URI;
        this.transactionUri = process.env.COLLECTION_TRANSACTION_URI;
        this.transactionStatusUri = process.env.COLLECTION_TRANSACTION_STATUS_URI;
        this.accountBalanceUri = process.env.COLLECTION_ACCOUNT_BALANCE_URI;
        this.subscriptionKey = process.env.COLLECTIONS_LIVE_KEY;
        //this.accountStatusUri = process.env.COLLECTION_ACCOUNT_HOLDER_STATUS_URI
        this.accountHolderInfoUri = process.env.COLLECTION_ACCOUNT_HOLDER_STATUS_URI;
        this.paymentRequestData = {};
        this.XID = "";
        this.bearerAuth = "";
        this.transactionStatusData = {};
        this.headers = {
            'Content-Type': 'application/json',
            Authorization: `Basic ${this.auth}`,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey
        };
    }
    requestToPay(externalId, amount, phoneNumber, message) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = JSON.stringify({
                amount: amount,
                currency: "GHS",
                externalId: externalId,
                payer: {
                    partyIdType: "MSISDN",
                    partyId: phoneNumber
                },
                payerMessage: "Uhsoka Solutions",
                payeeNote: message
            });
            let config = {
                method: 'POST',
                headers: Object.assign({}, this.headers)
            };
            let x_r_id = (0, uuid_1.v4)();
            this.XID = x_r_id;
            let rsp = yield axios_1.default.post("https://proxy.momoapi.mtn.com/collection/token/", null, config)
                .then(resp => {
                let authorization = `Bearer ${resp.data.access_token}`;
                //console.log(authorization,"AUTHORIZATION GOES HERE")
                this.bearerAuth = authorization;
                let config = { method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: authorization,
                        'X-Target-Environment': 'mtnghana',
                        //'X-Callback-Url':"localhost:8000",
                        'X-Reference-Id': x_r_id,
                        'Ocp-Apim-Subscription-Key': this.subscriptionKey
                    } };
                return axios_1.default.post("https://proxy.momoapi.mtn.com/collection/v1_0/requesttopay", data, config)
                    .then(dat => {
                    //console.log(dat,'\n',dat.status,"EVERYTHING GWAN BE IREEEE")
                    let data = dat;
                    this.paymentRequestData = dat;
                    return data;
                    //getTransactionStatus(dat.config.headers['X-Regerence-Id'']).then(status=>{if(kmsg.data.status == "SUCCESSFUL"){
                    //socket(redirect == "yes") + apollo call to change user balance pending + add subscription + number of days
                    // }})
                    //console.log(dat)
                    //res.send({status:dat.status,statusText:dat.statusText,data:dat.data})
                }).catch(err => {
                    console.log(err);
                    this.paymentRequestData = { status: err.status,
                        error: "An Error Occured" };
                    return err;
                });
            }).catch(err => {
                this.paymentRequestData = {
                    status: err.status,
                    error: "an Error Occured"
                };
                ///here again 
                console.log(err);
                return err;
               
            });
            return rsp;
        });
    }
    getTransactionStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            let config = { headers: {
                    Authorization: this.bearerAuth,
                    'X-Target-Environment': 'mtnghana',
                    'Ocp-Apim-Subscription-Key': this.subscriptionKey
                }
            };
            //here
           // console.log(config)
            if (this.XID) {
                let sts = yield axios_1.default.get(`https://proxy.momoapi.mtn.com/collection/v1_0/requesttopay/${this.XID}`, config).then(resp => {
                    let status = resp.data.status;
                    this.transactionStatusData = status;
                    console.log(status,resp.data.reason);
                    return status;
                }).catch(err => {
                    console.log(err)
                    return "Network Error "
                
                });
                console.log("server", sts);
                return sts;
            }
        });
    }
    getAccountBalance() { }
}
module.exports = Collection;
