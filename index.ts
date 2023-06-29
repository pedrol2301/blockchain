import * as crypto from 'crypto';

class Trasaction {

    constructor(
        public amount: number,
        public payer: string,
        public payee: string
    ){}

    toString(){
        return JSON.stringify(this);
    }
}

class Block {

    public nonce = Math.round(Math.random() * 999999999)
    constructor(
        public prevHash: string,
        public transaction: Trasaction,
        public ts = Date.now()
    ){}

    get hash(){
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');

        hash.update(str).end();
        return hash.digest('hex')
    }
}

class Chain {
    public static instance = new Chain();

    chain: Block[];

    constructor(){
        this.chain = [new Block('', new Trasaction(100, 'genesis', 'satoshi'))];
    }
    get lastBlock(){
        return this.chain[this.chain.length - 1];
    }

    addBlock(trasaction: Trasaction, senderPublicKey: string, signature: Buffer){
        //Whith Validation
        const verifier = crypto.createVerify('SHA256');
        verifier.update(trasaction.toString());


        const isValid = verifier.verify(senderPublicKey, signature);
        if(isValid){
            const newBlock = new Block(this.lastBlock.hash,trasaction);
            this.mine(newBlock.nonce)
            this.chain.push(newBlock);
        }

        //Without validation
        // const newBlock = new Block(this.lastBlock.hash,trasaction);
        // this.chain.push(newBlock);
    }
    mine(nonce: number){
        let solution = 1;
        console.log('⛏️ mining...');
        while(true){
            const hash = crypto.createHash('MD5');
            hash.update((nonce+solution).toString()).end();

            const attempt = hash.digest('hex');

            if(attempt.substring(0,4) === '0000'){
                console.log(`Solved: ${solution}`)
                return solution;
            }
            solution +=1;
        }

    }
}

class Wallet {
    public publicKey: string;
    public privateKey: string;


    constructor(){
        const keypair = crypto.generateKeyPairSync('rsa',{
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem'},
            privateKeyEncoding: { type: 'pkcs8', format: 'pem'}
        });

        this.publicKey = keypair.publicKey
        this.privateKey = keypair.privateKey
    }

    sendMoney(amount: number, payeePublicKey: string){
        const trasaction = new Trasaction(amount, this.publicKey, payeePublicKey);
        const sign = crypto.createSign('SHA256');
        sign.update(trasaction.toString()).end();
        
        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(trasaction,this.publicKey, signature)
    }
}

const satoshi = new Wallet();
const alice = new Wallet();
const bob = new Wallet();

satoshi.sendMoney(50,bob.publicKey)
// console.log( Chain.instance.chain[Chain.instance.chain.length - 1])
console.log(Chain.instance)
bob.sendMoney(25,alice.publicKey)
// console.log( Chain.instance.chain[Chain.instance.chain.length - 1])
console.log(Chain.instance)
alice.sendMoney(12.5,satoshi.publicKey)
// console.log( Chain.instance.chain[Chain.instance.chain.length - 1])
console.log(Chain.instance)
