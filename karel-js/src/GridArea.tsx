import { useSnapshot } from "valtio";
import { Cell, store } from "./Store";

import './App.scss';
import { Checkbox, ChoiceGroup, Dropdown, HoverCard, HoverCardType, IPlainCardProps, SpinButton } from "@fluentui/react";
import { useState } from "react";

export default function Gridrea(props: {gridActive: boolean, running: boolean}){

    const snap = useSnapshot(store);

    const [currentClicked, setCurrentClicked] = useState({row: -1, col: -1});

    function renderCells(){
        return snap.world.grid.map((row, rowIndex) => {
            return (
                <div className="CellRow" key={"row" + rowIndex}>
                    {row.map((cell, colIndex) => <DispCell 
                                                    setClicked={() => setCurrentClicked({row: rowIndex, col: colIndex})} 
                                                    clicked={props.gridActive && currentClicked.row === rowIndex && currentClicked.col === colIndex} 
                                                    allowChanges={!props.running} 
                                                    key={"row"+rowIndex+"col"+colIndex} 
                                                    cell={cell} 
                                                    hasKarel={snap.world.karel.row === rowIndex && snap.world.karel.column === colIndex} 
                                                    karelDir={snap.world.karel.facing}
                                                    row={rowIndex}
                                                    col={colIndex}
                                                    />)}
                </div>
            )
        })
    }

    return (
        <div>
            {renderCells()}
        </div>
    )
}

function toggleWall(dir: "North" | "East" | "South" | "West", row: number, col: number){
    switch(dir){
        case "North": store.world.grid[row][col].wallNorth = !store.world.grid[row][col].wallNorth; store.world.grid[row-1][col].wallSouth = !store.world.grid[row-1][col].wallSouth; break;
        case "East": store.world.grid[row][col].wallEast = !store.world.grid[row][col].wallEast; store.world.grid[row][col+1].wallWest = !store.world.grid[row][col+1].wallWest; break;
        case "South": store.world.grid[row][col].wallSouth = !store.world.grid[row][col].wallSouth; store.world.grid[row+1][col].wallNorth = !store.world.grid[row+1][col].wallNorth; break;
        case "West": store.world.grid[row][col].wallWest = !store.world.grid[row][col].wallWest; store.world.grid[row][col-1].wallEast = !store.world.grid[row][col-1].wallEast; break;
    }
    
}

function DispCell(props: {row: number, col: number, setClicked: () => void, clicked: boolean, allowChanges: boolean, cell: Cell, hasKarel: boolean, karelDir: "North" | "East" | "South" | "West"}){
    
    const card = (
        <div className="popUp">
            <div>
                <span>
                    <Checkbox checked={props.cell.wallNorth} label="North wall" onChange={() => toggleWall("North", props.row, props.col)}/>
                    <Checkbox checked={props.cell.wallEast} label="East wall" onChange={() => toggleWall("East", props.row, props.col)}/>
                    <Checkbox checked={props.cell.wallSouth} label="South wall" onChange={() => toggleWall("South", props.row, props.col)}/>
                    <Checkbox checked={props.cell.wallWest} label="West wall" onChange={() => toggleWall("West", props.row, props.col)}/>
                    <SpinButton label="Beepers in cell" value={props.cell.beepers.toString()} onChange={(e, newVal) => store.world.grid[props.row][props.col].beepers = parseInt(newVal ?? "0")}/>
                </span>
                <Checkbox checked={props.hasKarel} label="Karel" onChange={(e, checked) => {if(checked){store.world.karel.column = props.col; store.world.karel.row = props.row;}}}/>
                {props.hasKarel ? <span>
                    <ChoiceGroup disabled={!props.hasKarel} label="Facing" options={["North", "East", "South", "West"].map(dir => {return{text: dir, key: dir}})} onChange={(e, selected) => selected ? store.world.karel.facing = selected.key as "North" | "East" | "South" | "West" : store.world.karel.facing = "North"}/>
                    <SpinButton disabled={!props.hasKarel} label="Karel Beepers" value={store.world.karel.beepers.toString()} onChange={(e, newVal) => store.world.karel.beepers = parseInt(newVal ?? "0")}/>
                </span> : null}
            </div>
        </div>
    )
    
    return (
        <>
            <span className={"Cell " + (props.cell.wallNorth ? "WallNorth ":"") + (props.cell.wallEast ? "WallEast ":"") + (props.cell.wallSouth ? "WallSouth ":"") + (props.cell.wallWest ? "WallWest":"")} onClick={() => props.setClicked()}>{props.hasKarel ? karelGraphic() : ""}<br/>{props.cell.beepers || ""}{props.clicked ? card : null}</span>
        </>
        //TODO handle walls
    )

    function karelGraphic(){
        switch (props.karelDir) {
            case "North": return "^";
            case "East": return ">";
            case "South": return "v";
            case "West": return "<";
        }
    }
}