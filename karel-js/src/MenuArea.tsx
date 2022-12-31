import { IconButton } from "@fluentui/react";

export default function MenuArea(props: {run: Function, validate: Function}){
    return (
        <div>
            <span><IconButton onClick={() => props.run()} iconProps={{iconName: "Play"}} title="Run" ariaLabel="Run"/></span>
            <span><IconButton onClick={() => props.validate()} iconProps={{iconName: "DocumentApproval"}} title="Validate" ariaLabel="Validate"/></span>
        </div>
    )
}