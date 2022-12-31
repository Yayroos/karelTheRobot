import { useSnapshot } from "valtio";
import { Cell, store } from "./Store";

import './App.css';

export default function Gridrea(){

    const snap = useSnapshot(store);

    function renderCells(){
        return snap.world.grid.map((row, rowIndex) => {
            return (
                <div className="CellRow" key={"row" + rowIndex}>
                    {row.map((cell, colIndex) => <DispCell key={"row"+rowIndex+"col"+colIndex} cell={cell} hasKarel={snap.world.karel.row === rowIndex && snap.world.karel.column === colIndex} karelDir={snap.world.karel.facing}/>)}
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

function DispCell(props: {cell: Cell, hasKarel: boolean, karelDir: "North" | "East" | "South" | "West"}){
    return (
        <span className="Cell">{props.cell.beepers || ""}{props.hasKarel ? karelGraphic() : ""}</span>
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