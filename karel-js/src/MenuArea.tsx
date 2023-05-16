import { IconButton } from "@fluentui/react";
import { store } from "./Store";

export default function MenuArea(props: {run: Function, stop: Function, reset: Function, validate: Function, worldEditor: Function}){
    return (
        <div>
            <span><IconButton onClick={() => props.run()} iconProps={{iconName: "Play"}} title="Run" ariaLabel="Run"/></span>
            <span><IconButton onClick={() => props.stop()} iconProps={{iconName: "Stop"}} title="Stop" ariaLabel="Stop"/></span>
            <span><IconButton onClick={() => props.reset()} iconProps={{iconName: "Refresh"}} title="Reset"ariaLabel="Reset"/></span>
            <span><IconButton onClick={() => props.validate()} iconProps={{iconName: "DocumentApproval"}} title="Validate" ariaLabel="Validate"/></span>
            <span><IconButton onClick={() => props.worldEditor()} iconProps={{iconName: "CloudImportExport"}} title="Import/Export world" ariaLabel="Import/Export world"/></span>
        </div>
    )
}