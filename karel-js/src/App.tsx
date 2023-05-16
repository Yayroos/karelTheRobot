import React, { useState } from 'react';
import { proxy, useSnapshot } from 'valtio';
import './App.scss';
import { defineToken, execBeginToken, execEndToken, progBeginToken, progEndToken } from './Consts';
import GridArea from './GridArea';
import MenuArea from './MenuArea';
import { Conditions, DefinedInstruction, Running, ValidationResults, store } from './Store';
import Tokenizer, { Tokens } from './Tokenizer';
import { ITextFieldStyles, SpinButton, TextField } from '@fluentui/react';
import WorldStringEditor from './WorldStringEditor';

const runState = proxy({val: false});
const progPointer = proxy<{val: number}>({val: -1});

let stepper: NodeJS.Timer;

function App() {
    const snap = useSnapshot(store);
    
    const dispRun = useSnapshot(runState);
    
    const dispPointer = useSnapshot(progPointer);

    const [gridActive, setGridActive] = useState<boolean>(false);
    const [showWorldStringEditor, setShowWorldStringEditor] = useState<string>();
    const [stepDelay, setStepDelay] = useState<number>(300); 

    let results: ValidationResults = {
        execStart: -1,
        program: {
            defined: [],
            executable: false
        }
    }
    let running: Running = {
        stop: false,
        stack: [],
        iterators: [],
    }

    const codeAreaStyles: Partial<ITextFieldStyles> = {
        field: {
            fontSize: 'larger',
            fontFamily: "'Courier New', Courier, monospace",
            minHeight: "400px"
        }
    }

    return (
        <div className="App">
            {showWorldStringEditor ? <WorldStringEditor string={showWorldStringEditor} cancel={() => setShowWorldStringEditor(undefined)} save={(newVal) => openEnteredWorldString(newVal)}/> : null}
            <div onClick={() => setGridActive(false)}>
                <MenuArea run={() => run()} stop={() => turnOff()} reset={reset} validate={doValidation} worldEditor={worldEditor}/>
            </div>
            <div className='mainArea'>
                <div className='codeArea' onClick={() => setGridActive(false)}>
                    {dispRun.val ? 
                        snap.codeString.split("\n").map((line, index) => <div key={index} className={(index === dispPointer.val ? 'hightlight' : '')}>{line}</div>)
                        : <TextField styles={codeAreaStyles} multiline defaultValue={store.codeString} onChange={(_e, newVal) => store.codeString = newVal ?? ""}/>
                    }

                </div>
                <div onClick={() => setGridActive(true)}>
                    <GridArea gridActive={gridActive} running={runState.val}/>
                </div>
            </div>
            <div className="settingsArea">
                <SpinButton label='Time Between Steps (millis)' value={stepDelay.toString()} onChange={(e, newVal) => setStepDelay(parseInt(newVal ?? "0"))}/>
            </div>
        </div>
    );

    function worldEditor(){
        const worldString = JSON.stringify(snap.world);

        setShowWorldStringEditor(worldString);
    }

    function openEnteredWorldString(newWorld: string){
        store.world = JSON.parse(newWorld);
        //TODO validate the world string before applying it

        setShowWorldStringEditor(undefined);
    }

    function doValidation(){
    
        const tokenizer = new Tokenizer(results, snap.codeString);
    
        
        if (tokenizer.isValid()) {
            results.program.executable = true;
            progPointer.val = results.execStart;
            console.log("start is line", progPointer.val)
            alert("check passed"); //TODO make popup
        } else {
            results.program.executable = false;
            progPointer.val = -1;
            alert("code invalid"); //TODO make popup
        }
    }

    function reset(){
        store.world = store.resetState;
        runState.val = false;
        progPointer.val = -1;
    }
    
    function run(){
        doValidation()
        
        if(results.program.executable){
            const lines = snap.codeString.split("\n");
            runState.val = true;
            //save the start state to reset to
            store.resetState = JSON.parse(JSON.stringify(snap.world));
            //run
            stepper = setInterval(() => {
                console.log("runstep")
                if(progPointer.val && progPointer.val !== -1 && runState.val){
                    console.log("running ", progPointer.val, lines[progPointer.val], running.stack, "interval id is", stepper)
                    runLine(lines[progPointer.val]);
                } else {
                    console.log("in end state", stepper, runState.val, progPointer.val)
                    clearInterval(stepper);
                    runState.val = false;
                    progPointer.val = -1;
                }
            }, stepDelay);
        }
    }

    function runLine(line: string){    
    
        const parts = line.trim().split(" ");
        const defined = results.program.defined.find(entry => entry.name === parts[0]);
        if(defined){
            running.stack.push({entryLine: defined.lineStart, exitLine: progPointer.val + 1, blockType: "defined"});
            progPointer.val = defined.lineStart;
        } else {
            switch (parts[0]) {
                case "begin":
                case "beginning-of-execution":
                    //move through the begin and into the block
                    progPointer.val = progPointer.val + 1;
                    break;
                case 'turnleft':
                    turnLeft();
                    progPointer.val = progPointer.val + 1;
                    break;
                case "move":
                    move();
                    progPointer.val = progPointer.val + 1;
                    break;
                case "pickbeeper":
                    pickBeeper();
                    progPointer.val = progPointer.val + 1;
                    break;
                case "putbeeper":
                    putBeeper();
                    progPointer.val = progPointer.val + 1;
                    break;
                case "end-of-execution":
                case "turnoff":
                    turnOff();
                    break;
                case "if":
                    let elsePoint = findElse(progPointer.val);
                    if(checkCondition(parts[1] as Conditions)){
                        //enter the block
                        running.stack.push({entryLine: progPointer.val, exitLine: (elsePoint !== -1 ? findEnd(elsePoint) : findEnd(progPointer.val)) + 1, blockType: "if", condition: parts[1] as Conditions})
                        progPointer.val = progPointer.val + 1;
                    } else {
                        //move to the associated else block
                        if(elsePoint !== -1){
                            running.stack.push({entryLine: progPointer.val, exitLine: findEnd(progPointer.val) + 1, blockType: "else"})
                        }
                        progPointer.val = (elsePoint !== -1 ? elsePoint : findEnd(progPointer.val) + 1);
                    }
                    break;
                case "else":
                    //enter the block
                    running.stack.push({entryLine: progPointer.val, exitLine: findEnd(progPointer.val) + 1, blockType: "else"})
                    progPointer.val = progPointer.val + 1;
                    break
                case "while":
                    //(entryLine is the line after the iterator to avoid triggering the opening behaviour again)
                    running.stack.push({entryLine: progPointer.val + 1, exitLine: findEnd(progPointer.val) + 1, blockType: "while", condition: parts[1] as Conditions})
    
                    if(checkCondition(parts[1] as Conditions)){
                        //enter the block
                        console.log("condition", parts[1], "true")
                        progPointer.val = progPointer.val + 1;
                    } else {
                        console.log("condition", parts[1], "false")
                        progPointer.val = running.stack.pop()?.exitLine ?? -1;
                    }
                    break;
                case "iterate":
                    //push the iterator
                    running.iterators.push({count: parseInt(parts[1]) -1, pointer: progPointer.val + 1});
                    //enter the block (entryLine is the line after the iterator to avoid triggering the opening behaviour again)
                    running.stack.push({entryLine: progPointer.val + 1, exitLine: findEnd(progPointer.val), blockType: "iterate"})
                    progPointer.val = progPointer.val + 1;
                    break;
                case "end":
                    switch (last(running.stack).blockType) {
                        case "if":
                        case "else":
                            progPointer.val = running.stack.pop()?.exitLine ?? -1;
                            break;
                        case "while":
                            if(checkCondition(last(running.stack).condition)){
                                progPointer.val = last(running.stack).entryLine;
                            } else {
                                progPointer.val = running.stack.pop()?.exitLine ?? -1;
                            }
                            break;
                        case "iterate":
                            if(last(running.iterators).count === 0){
                                progPointer.val = running.stack.pop()?.exitLine ?? -1;
                            } else {
                                last(running.iterators).count--;
                                progPointer.val = last(running.stack).entryLine;
                            }
                            break;
                        case "defined":
                            progPointer.val = running.stack.pop()?.exitLine ?? -1;
                            break;
                    }
            }
        }
        
    }


    function findElse(pointer: number): number{
        const end = findEnd(pointer);
        if(store.codeString.split("\n")[end + 1].startsWith("else")){
            return end+1;
        } else {
            return -1;
        }
    }

    function findEnd(pointer: number): number{
        let counter = 0;
        const lines = store.codeString.split("\n");
        let i = pointer + 1;
        for(let i = pointer+1; i < lines.length; i++){
            if(lines[i].trim() === "begin"){
                counter++;
            } else if(lines[i].trim() === "end"){
                counter--;
            }

            if(counter === 0){
                return i;
            }
        }
        return -1;
    }

    function last(arr: readonly any[]): any{
        return arr[arr.length -1];
    }

    

    function checkCondition(cond: Conditions): boolean{
        switch (cond){
            case "front-is-clear": {
                switch (store.world.karel.facing){
                    case "North": return !store.world.grid[store.world.karel.row][store.world.karel.column].wallNorth
                    case "East":return !store.world.grid[store.world.karel.row][store.world.karel.column].wallEast
                    case "South":return !store.world.grid[store.world.karel.row][store.world.karel.column].wallSouth
                    case "West":return !store.world.grid[store.world.karel.row][store.world.karel.column].wallWest 
                }
            }
            case "front-is-blocked": {
                switch (store.world.karel.facing){
                    case "North": return store.world.grid[store.world.karel.row][store.world.karel.column].wallNorth
                    case "East":return store.world.grid[store.world.karel.row][store.world.karel.column].wallEast
                    case "South":return store.world.grid[store.world.karel.row][store.world.karel.column].wallSouth
                    case "West":return store.world.grid[store.world.karel.row][store.world.karel.column].wallWest 
                }
            }
            case "left-is-clear":{
                switch (store.world.karel.facing){
                    case "North": return !store.world.grid[store.world.karel.row][store.world.karel.column].wallWest
                    case "East":return !store.world.grid[store.world.karel.row][store.world.karel.column].wallNorth
                    case "South":return !store.world.grid[store.world.karel.row][store.world.karel.column].wallEast
                    case "West":return !store.world.grid[store.world.karel.row][store.world.karel.column].wallSouth 
                }
            }
            case "left-is-blocked": {
                switch (store.world.karel.facing){
                    case "North": return store.world.grid[store.world.karel.row][store.world.karel.column].wallWest
                    case "East":return store.world.grid[store.world.karel.row][store.world.karel.column].wallNorth
                    case "South":return store.world.grid[store.world.karel.row][store.world.karel.column].wallEast
                    case "West":return store.world.grid[store.world.karel.row][store.world.karel.column].wallSouth 
                }
            }
            case "right-is-clear":{
                switch (store.world.karel.facing){
                    case "North": return !store.world.grid[store.world.karel.row][store.world.karel.column].wallEast
                    case "East":return !store.world.grid[store.world.karel.row][store.world.karel.column].wallSouth
                    case "South":return !store.world.grid[store.world.karel.row][store.world.karel.column].wallWest
                    case "West":return !store.world.grid[store.world.karel.row][store.world.karel.column].wallNorth 
                }
            }
            case "right-is-blocked": {
                switch (store.world.karel.facing){
                    case "North": return store.world.grid[store.world.karel.row][store.world.karel.column].wallEast
                    case "East":return store.world.grid[store.world.karel.row][store.world.karel.column].wallSouth
                    case "South":return store.world.grid[store.world.karel.row][store.world.karel.column].wallWest
                    case "West":return store.world.grid[store.world.karel.row][store.world.karel.column].wallNorth 
                }
            }
            case "back-is-clear":{
                switch (store.world.karel.facing){
                    case "North": return !store.world.grid[store.world.karel.row][store.world.karel.column].wallSouth
                    case "East":return !store.world.grid[store.world.karel.row][store.world.karel.column].wallWest
                    case "South":return !store.world.grid[store.world.karel.row][store.world.karel.column].wallNorth
                    case "West":return !store.world.grid[store.world.karel.row][store.world.karel.column].wallEast 
                }
            }
            case "back-is-blocked": {
                switch (store.world.karel.facing){
                    case "North": return store.world.grid[store.world.karel.row][store.world.karel.column].wallSouth
                    case "East":return store.world.grid[store.world.karel.row][store.world.karel.column].wallWest
                    case "South":return store.world.grid[store.world.karel.row][store.world.karel.column].wallNorth
                    case "West":return store.world.grid[store.world.karel.row][store.world.karel.column].wallEast 
                }
            }
            case "on-beeper": return store.world.grid[store.world.karel.row][store.world.karel.column].beepers > 0
            case "not-on-beeper": return store.world.grid[store.world.karel.row][store.world.karel.column].beepers === 0
            case "facing-north": return store.world.karel.facing === "North"
            case "not-facing-north": return store.world.karel.facing !== "North"
            case "facing-east": return store.world.karel.facing === "East"
            case "not-facing-east": return store.world.karel.facing !== "East"
            case "facing-south": return store.world.karel.facing === "South"
            case "not-facing-south": return store.world.karel.facing !== "South"
            case "facing-west": return store.world.karel.facing === "West"
            case "not-facing-west": return store.world.karel.facing !== "West"
            case "beepers-in-bag": return store.world.karel.beepers > 0
            case "no-beepers-in-bag": return store.world.karel.beepers === 0
        }
    }


    function turnOff() {
        console.log("turn off called");
        runState.val = false;
    }

    function putBeeper() {
        console.log("putbeeper")
        if(store.world.karel.beepers > 0){
            store.world.karel.beepers--;
            store.world.grid[store.world.karel.row][store.world.karel.column].beepers++;
        } else {
            turnOff();
        }
    }
    function pickBeeper() {
        console.log("pickbeeper")
        if(store.world.grid[store.world.karel.row][store.world.karel.column].beepers > 0){
            store.world.karel.beepers++;
            store.world.grid[store.world.karel.row][store.world.karel.column].beepers--;
        } else {
            turnOff();
        }
    }
    
    function turnLeft(){
        console.log("turnleft")
        switch (store.world.karel.facing) {
            case "North": store.world.karel.facing = "West"; break;
            case "East": store.world.karel.facing = "North"; break;
            case "South": store.world.karel.facing = "East"; break;
            case "West": store.world.karel.facing = "South"; break;
        }
    }

    function move(){
        console.log("move")
        if(checkCondition("front-is-clear")){
            switch (store.world.karel.facing) {
                case "North": store.world.karel.row--; break;
                case "East": store.world.karel.column++; break;
                case "South": store.world.karel.row++; break;
                case "West": store.world.karel.column--; break;
            }
        } else {
            turnOff();
        }
        
    }
}

export default App;
