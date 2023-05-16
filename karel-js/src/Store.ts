import { proxy, useSnapshot } from 'valtio';
import Karel from './Karel';

function initGrid(rows: number = 10, cols: number = 10): Cell[][]{
    let retGrid = new Array(rows);
    for(let i = 0; i < rows; i++){
        retGrid[i] = new Array(cols);
        for(let j = 0; j < cols; j++){
            retGrid[i][j] = {
                wallNorth: i === 0,
                wallEast: j === 0,
                wallSouth: i === rows-1,
                wallWest: j === cols-1,
                beepers: 0,
            }
        }
    }
    return retGrid;
}

export type Cell = {
    wallNorth: boolean,
    wallEast: boolean,
    wallSouth: boolean,
    wallWest: boolean,
    beepers: number,
}

export type KarelType = {
    facing: "North" | "East" | "South" | "West",
    row: number,
    column: number,
    beepers: number,
}

type World = {
    grid: Cell[][],
    karel: KarelType,
}

export type DefinedInstruction = {
    name: string,
    lineStart: number
}

type Program = {
    defined: DefinedInstruction[],
    executable: boolean
}

export type Conditions = "front-is-clear" | 
                    "front-is-blocked" | 
                    "left-is-clear" | 
                    "left-is-blocked" | 
                    "right-is-clear" | 
                    "right-is-blocked" | 
                    "back-is-clear" | 
                    "back-is-blocked" | 
                    "on-beeper" | 
                    "not-on-beeper" | 
                    "facing-north" | 
                    "not-facing-north" | 
                    "facing-east" | 
                    "not-facing-east" | 
                    "facing-south" | 
                    "not-facing-south" | 
                    "facing-west" | 
                    "not-facing-west" | 
                    "beepers-in-bag" | 
                    "no-beepers-in-bag"

type StackFrame = {
    exitLine: number,
    entryLine: number,
    blockType: "main" | "defined" | "if" | "else" | "while" | "iterate",
    condition?: Conditions
}

type Iterator = {
    pointer: number;
    count: number
}

export type Running = {
    stop: boolean;
    stack: StackFrame[],
    iterators: Iterator[]
}

export type StoreType = {
    codeString: string, 
    world: World
}

export const store = proxy<StoreType>({
    codeString: "",
    world: {
        grid: initGrid(),
        karel: Karel()
    },
});

export type ValidationResults = {
    execStart: number;
    program: Program
}
