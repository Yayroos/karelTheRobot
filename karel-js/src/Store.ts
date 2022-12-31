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
    programStart: number,
    executable: boolean
}

export type StoreType = {
    codeString: string, 
    program: Program, 
    world: World
}

export const store = proxy<StoreType>({
    codeString: "",
    program: {
        defined: [],
        programStart: 0,
        executable: false
    },
    world: {
        grid: initGrid(),
        karel: Karel()
    },
});
