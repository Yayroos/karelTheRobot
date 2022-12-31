import { DefinedInstruction, store } from "./Store";

export default class Tokenizer {

    private static defineToken = "define-new-instruction";
    private static execBeginToken = "beginning-of-execution";
    private static execEndToken = "end-of-execution";
    private static progBeginToken = "beginning-of-program";
    private static progEndToken = "end-of-program";

    public inputTokens: string[] = [];

    static index = 0;

    constructor(rawString: string){
        let input = rawString.split('\n');
        input.forEach(line => {
            line = line.trim();
            this.inputTokens = [...this.inputTokens, ...line.split(" ").filter(t => t !== "")];
        });
    }

    isValid(defined: DefinedInstruction[]) {
        Tokens.definedInstructions = [...defined];

        //check all tokens are valid
        for (let i = 0; i < this.inputTokens.length; i++) {
            let token = this.inputTokens[i];
            if (!Tokens.validToken(token) && !this.isNumeric(token)) {
                console.log("bad token " + token + " at token number " + i);
                return false;
            }
        }
        let i = this.checkBlock();
        if(i > 1){
            this.reset();
            return true;
        } else {
            console.log("checkBlock failed, return was" + i);
            return false;
        }
    }

    /**
     * Check the validity of a block of Karel code, including recursive checks where needed
     * @return the number of tokens in the block, or -1 if there is an error
     */
    checkBlock(): number{
        let token: string = this.next();
        console.log("checkblock started with " + token);
        switch (token) {
            case Tokenizer.progBeginToken : {
                let i = 0;
                while (token !== Tokenizer.progEndToken){
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
                    return (token === Tokenizer.progEndToken ? i+2 : -1);
                } else {
                    alert("Failed in total block");
                    return -1;
                }
            }
            case Tokenizer.execBeginToken : {
                let i = 1;
                while(true){
                    token = this.peek();
                    if(token === Tokenizer.execEndToken){
                        this.consume();
                        i++;
                        console.log("returning from good BEGIN END EXEC block");
                        return i;
                    }
                    if(!(Tokens.instructions.includes(token) || Tokens.definedInstructions.some(inst => inst.name === token))){
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
                    if(token === "end"){
                        i++;
                        this.consume();
                        console.log("returning from good BEGIN END block");
                        return i;
                    }
                    if(!(Tokens.instructions.includes(token) || Tokens.definedInstructions.some(inst => inst.name === token))){
                        console.log("entering checkBlock from BEGIN with token " + this.peek());
                        let num: number = this.checkBlock();
                        if(num < 1){
                            alert("failed in a BEGIN END " + token + this.peek() + Tokenizer.index);
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
            case Tokenizer.defineToken : {
                token = this.next();
                if(snap.program.defined.some(inst => inst.name === token)){
                    token = this.next();
                    if(token === "as"){
                        console.log("returning from good DEFINE block");
                        return this.checkBlock() + 3;
                    } else {
                        alert("Missing AS after DEFINE_NEW_INSTRUCTION"); //TODO make popup
                        return -1;
                    }
                } else {
                    console.log("This shouldn't be able to happen, something's wrong " + token + " " + Tokenizer.index);
                    return -1;
                }
            }
            case "while" : {
                token = this.next();
                if(Tokens.conditions.includes(token)){
                    token = this.next();
                    if(token === "do"){
                        let i = this.checkBlock();
                        return (i > 1 ? i+3 : -4);
                    } else {
                        alert("Missing AS after WHILE"); //TODO make popup
                        return -1;
                    }
                } else {
                    alert("Missing condition after WHILE"); //TODO make popup
                    return -1;
                }
            }
            case "iterate" : {
                token = this.next();
                if(this.isNumeric(token)){
                    token = this.next();
                    if(token === "times"){
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
                if(Tokens.conditions.includes(token)){
                    token = this.next(); //use condition, get THEN
                    if(token === "then"){
                        let i = this.checkBlock(); //token after THEN should be BEGIN
                        if(i <= 1) {
                            return -6;
                        }
                        if(this.peek() === "else" ){
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
                alert("Bad start of block (are you missing a BEGIN ?) " + token + " " + Tokenizer.index);
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

    next(): string{
        return this.inputTokens[Tokenizer.index++];
    }

    consume(){
        Tokenizer.index++;
    }

    peek(): string{
        try{
            return this.inputTokens[Tokenizer.index];
        } catch (e){
            return "";
        }
    }

    reset(){
        Tokenizer.index = 0;
    }

    goTo(jumpPoint: number): number{
        let temp = Tokenizer.index;
        Tokenizer.index = jumpPoint;
        return temp;
    }

    
}

export class Tokens {

    public static defineToken = "define-new-instruction";
    public static execBeginToken = "beginning-of-execution";
    public static execEndToken = "end-of-execution";
    public static progBeginToken = "beginning-of-program";
    public static progEndToken = "end-of-program";

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

    public static definedInstructions: DefinedInstruction[] = [];

    static validToken(s: string): boolean{
        return this.validTokens.includes(s) || this.instructions.includes(s) || this.conditions.includes(s) || this.definedInstructions.some(inst => inst.name === s);
    }
}