import React from 'react';
import { useSnapshot } from 'valtio';
import './App.css';
import CodeArea from './CodeArea';
import GridArea from './GridArea';
import MenuArea from './MenuArea';
import { DefinedInstruction, store } from './Store';
import Tokenizer, { Tokens } from './Tokenizer';

function App() {
    const snap = useSnapshot(store);

    return (
        <div className="App">
            <MenuArea run={useRun} validate={useValidation}/>
            <div className='mainArea'>
                <CodeArea/>
                <GridArea/>
            </div>
        </div>
    );

    function useValidation(){
    
        const tokenizer = new Tokenizer(snap.codeString);
    
        let progStart = 0;
        //get jump to points in tokens
        
        for (let i = 0; i < tokenizer.inputTokens.length; i++) {
            let token: string = tokenizer.inputTokens[i];
            if (token === Tokens.defineToken) {
                let err: boolean = store.program.defined.some(t => t.name === tokenizer.inputTokens[i + 1]);
                if (err) {
                    alert("Defining same instruction twice! (" + tokenizer.inputTokens[i + 1] + ")"); //TODO make popup
                    return;
                } else {
                    store.program.defined.push()
                }
            } else if (token === Tokens.execBeginToken && i + 1 !== snap.program.programStart) {
                if (snap.program.programStart === 0) {
                    store.program.programStart = i + 1;
                    progStart = i + 1;
                } else {
                    alert("Start of execution listed twice! (second at token " + i + ")"); //TODO make popup
                    return;
                }
            }
        }
    
        let lines: string[] = snap.codeString.split("\n");
    
        if (lines[0] !== Tokens.progBeginToken) {
            alert("Start of program not listed!"); //TODO make popup
            return;
        }
        if (lines[lines.length - 1] !== Tokens.progEndToken) {
            console.log("End of program not listed!"); //TODO make popup
            return;
        }
    
        for (let i = 1; i < lines.length; i++) {
            if (lines[i] === Tokens.progBeginToken) {
                alert("Start of program listed twice!"); //TODO make popup
            }
        }
    
        for (let i = 0; i < lines.length - 1; i++) {
            if (lines[i] === Tokens.progEndToken) {
                alert("End of program listed twice!"); //TODO make popup
            }
        }
    
        if (progStart === 0) {
            alert("Start of execution not listed!"); //TODO make popup
            return;
        }
    
        if (!lines.includes(Tokens.execEndToken)) {
            alert("End of execution not listed!"); //TODO make popup
            return;
        } else {
            if (snap.program.programStart > lines.indexOf(Tokens.execEndToken)) {
                alert("Exec ends before it begins!"); //TODO make popup
                return;
            }
        }
        if (tokenizer.isValid(snap.program.defined as DefinedInstruction[])) {
            store.program.executable = true;
            alert("check passed"); //TODO make popup
        } else {
            store.program.executable = false;
            alert("code invalid"); //TODO make popup
        }
    }
    
    function useRun(){
        
    
    
    }
}



export default App;
