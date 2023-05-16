import { IconButton } from "@fluentui/react";
import { store } from "./Store";

export default function MenuArea(props: {run: Function, stop: Function, validate: Function}){
    return (
        <div>
            <span><IconButton onClick={() => props.run()} iconProps={{iconName: "Play"}} title="Run" ariaLabel="Run"/></span>
            <span><IconButton onClick={() => props.stop()} iconProps={{iconName: "Stop"}} title="Stop" ariaLabel="Stop"/></span>
            <span><IconButton onClick={() => props.validate()} iconProps={{iconName: "DocumentApproval"}} title="Validate" ariaLabel="Validate"/></span>
        </div>
    )
}