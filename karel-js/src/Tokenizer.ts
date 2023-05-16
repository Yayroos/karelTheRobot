import { defineToken, execBeginToken, execEndToken, progBeginToken, progEndToken } from "./Consts";
import { DefinedInstruction, ValidationResults } from "./Store";

export default class Tokenizer {

    public inputTokens: {token: string, lineNum: number}[] = [];

    index = 0;

    results;

    constructor(results: ValidationResults, codeString: string){
        this.results = results;
        let input = codeString.split('\n');
        input.forEach((line, index) => {
            line = line.trim();
            this.inputTokens = [...this.inputTokens, ...line.split(" ").filter(t => t !== "").map(token => {return{token: token, lineNum: index}})];
        });
    }

    isValid() {
        console.log("in isValid");
        //reset program state
        this.results.program.defined = [];
        this.results.execStart = 0;
        this.results.program.executable = false;
        //let progStart = 0;
        //get jump to points in tokens
        
        for (let i = 0; i < this.inputTokens.length; i++) {
            let token: {token: string, lineNum: number} = this.inputTokens[i];
            if (token.token === defineToken) {
                let err: boolean = this.results.program.defined.some(t => t.name === this.inputTokens[i + 1].token);
                if (err) {
                    alert("Defining same instruction twice! (" + this.inputTokens[i + 1] + ")"); //TODO make popup
                    return;
                } else {
                    this.results.program.defined.push({name: this.inputTokens[i+1].token, lineStart: token.lineNum + 1});
                }
            } else if (token.token === execBeginToken && i + 1 !== this.results.execStart) {
                if (this.results.execStart === 0) {
                    this.results.execStart = token.lineNum;
                    //progStart = i + 1;
                } else {
                    alert("Start of execution listed twice! (second at token " + i + ")"); //TODO make popup
                    return;
                }
            }
        }
    
        if (this.inputTokens[0].token !== progBeginToken) {
            alert("Start of program not listed!"); //TODO make popup
            return;
        }
        if (this.inputTokens[this.inputTokens.length - 1].token !== progEndToken) {
            console.log("End of program not listed!"); //TODO make popup
            return;
        }
    
        for (let i = 1; i < this.inputTokens.length; i++) {
            if (this.inputTokens[i].token === progBeginToken) {
                alert("Start of program listed twice!"); //TODO make popup
            }
        }
    
        for (let i = 0; i < this.inputTokens.length - 1; i++) {
            if (this.inputTokens[i].token === progEndToken) {
                alert("End of program listed twice!"); //TODO make popup
            }
        }
    
        if (this.results.execStart === 0) {
            alert("Start of execution not listed!"); //TODO make popup
            return;
        }
    
        if (!this.inputTokens.map(token => token.token).includes(execEndToken)) {
            alert("End of execution not listed!"); //TODO make popup
            return;
        } else {
            if (this.results.execStart > this.inputTokens.map(token => token.token).indexOf(execEndToken)) {
                alert("Exec ends before it begins!"); //TODO make popup
                return;
            }
        }

        //Tokens.definedInstructions = [...results.program.defined];

        //check all tokens are valid
        for (let i = 0; i < this.inputTokens.length; i++) {
            let token = this.inputTokens[i];
            if (!(Tokens.validToken(token.token) || this.results.program.defined.some(inst => inst.name === token.token)) && !this.isNumeric(token.token)) {
                console.log("bad token " + token + " at token number " + i);
                return false;
            }
        }
        let i = this.checkBlock();
        if(i > 1){
            this.reset();
            return true;
        } else {
            this.reset();
            console.log("checkBlock failed, return was" + i);
            return false;
        }
    }

    /**
     * Check the validity of a block of Karel code, including recursive checks where needed
     * @return the number of tokens in the block, or -1 if there is an error
     */
    checkBlock(): number{
        let token: {token: string, lineNum: number} = this.next();
        console.log("checkblock started with " + token);
        switch (token.token) {
            case progBeginToken : {
                let i = 0;
                while (token.token !== progEndToken){
                    let num = this.checkBlock();
                    if(num < 0){
                        console.log("returning from bad block in prog");
                        return -1;
                    }
                    i += num;
                    token = this.peek();
                }
                if(i >= 1){
                    console.log("this should be prog end " + token);
                    return (token.token === progEndToken ? i+2 : -1);
                } else {
                    alert("Failed in total block");
                    return -1;
                }
            }
            case execBeginToken : {
                console.log("in execBeginToken case");
                let i = 1;
                while(true){
                    token = this.peek();
                    if(token.token === execEndToken){
                        this.consume();
                        i++;
                        console.log("returning from good BEGIN END EXEC block");
                        return i;
                    }
                    if(!(Tokens.instructions.includes(token.token) || this.results.program.defined.some(inst => inst.name === token.token))){
                        let num: number = this.checkBlock();
                        if(num < 1){
                            alert("Failed in execution block");
                            return -2;
                        } else {
                            i += num;
                        }
                    } else {
                        //it is an instruction, move on
                        this.next();
                        i++;
                    }
                }
            }
            case "begin" : {
                let i = 1;
                while(true){
                    token = this.peek();
                    if(token.token === "end"){
                        i++;
                        this.consume();
                        console.log("returning from good BEGIN END block");
                        return i;
                    }
                    if(!(Tokens.instructions.includes(token.token) || this.results.program.defined.some(inst => inst.name === token.token))){
                        console.log("entering checkBlock from BEGIN with token " + this.peek());
                        let num: number = this.checkBlock();
                        if(num < 1){
                            alert("failed in a BEGIN END " + token + this.peek() + this.index);
                            return -3;
                        } else {
                            i += num;
                        }
                    } else {
                        //it is an instruction, move on
                        this.consume();
                        i++;
                    }
                }
            }
            case defineToken : {
                token = this.next();
                if(this.results.program.defined.some(inst => inst.name === token.token)){
                    token = this.next();
                    if(token.token === "as"){
                        console.log("returning from good DEFINE block");
                        return this.checkBlock() + 3;
                    } else {
                        alert("Missing AS after DEFINE_NEW_INSTRUCTION"); //TODO make popup
                        return -1;
                    }
                } else {
                    console.log("This shouldn't be able to happen, something's wrong " + token + " " + this.index);
                    return -1;
                }
            }
            case "while" : {
                token = this.next();
                if(Tokens.conditions.includes(token.token)){
                    token = this.next();
                    if(token.token === "do"){
                        let i = this.checkBlock();
                        return (i > 1 ? i+3 : -4);
                    } else {
                        alert("Missing DO after WHILE"); //TODO make popup
                        return -1;
                    }
                } else {
                    alert("Missing condition after WHILE"); //TODO make popup
                    return -1;
                }
            }
            case "iterate" : {
                token = this.next();
                if(this.isNumeric(token.token)){
                    token = this.next();
                    if(token.token === "times"){
                        let i = this.checkBlock();
                        return (i > 1 ? i+3 : -5);
                    } else {
                        alert("Missing TIMES after ITERATE"); //TODO make popup
                        return -1;
                    }
                } else {
                    alert("Missing number after ITERATE"); //TODO make popup
                    return -1;
                }
            }
            case "if" : {
                token = this.next(); //use IF, get condition
                if(Tokens.conditions.includes(token.token)){
                    token = this.next(); //use condition, get THEN
                    if(token.token === "then"){
                        let i = this.checkBlock(); //token after THEN should be BEGIN
                        if(i <= 1) {
                            return -6;
                        }
                        if(this.peek().token === "else" ){
                            i++;
                            this.consume();
                            let num: number = this.checkBlock();
                            return (num > 1 ? i+num : -7);
                        }
                        return i;
                    } else {
                        alert("Missing THEN after IF"); //TODO make popup
                        return -1;
                    }
                } else {
                    alert("Missing condition after IF"); //TODO make popup
                    return -1;
                }
            }
            default : {
                alert("Bad start of block (are you missing a BEGIN ?) " + token + " " + this.index);
                return -1;
            }
        }
    }

    isNumeric(s: string): boolean{
        try{
            parseInt(s);
            return true;
        } catch (e) {
            return false;
        }
    }

    next(): {token: string, lineNum: number}{
        return this.inputTokens[this.index++];
    }

    consume(){
        this.index++;
    }

    peek(): {token: string, lineNum: number}{
        try{
            return this.inputTokens[this.index];
        } catch (e){
            return {token: "", lineNum: -1};
        }
    }

    reset(){
        this.index = 0;
    }

    goTo(jumpPoint: number): number{
        let temp = this.index;
        this.index = jumpPoint;
        return temp;
    }

    
}

export class Tokens {

    static validTokens: string[] = [
            "beginning-of-program", "end-of-program",
            "beginning-of-execution", "end-of-execution",
            "begin", "end", //can give the option of using {} instead of BEGIN and END, i think {} is cleaner
            "define-new-instruction", "as",

            "if", "then", "else",
            "while", "do",
            "iterate", "times"
    ]

    static conditions: string[] = [
            "front-is-clear",
            "front-is-blocked",
            "left-is-clear",
            "left-is-blocked",
            "right-is-clear",
            "right-is-blocked",
            "back-is-clear",
            "back-is-blocked",
            "on-beeper",
            "not-on-beeper",
            "facing-north",
            "not-facing-north",
            "facing-east",
            "not-facing-east",
            "facing-south",
            "not-facing-south",
            "facing-west",
            "not-facing-west",
            "beepers-in-bag",
            "no-beepers-in-bag"
    ]

    public static instructions: string[] = [
            "turnleft",
            "pickbeeper",
            "putbeeper",
            "move",
            "turnoff"
    ]

    //public static definedInstructions: DefinedInstruction[] = [];

    static validToken(s: string): boolean{
        return this.validTokens.includes(s) || this.instructions.includes(s) || this.conditions.includes(s);
    }
}