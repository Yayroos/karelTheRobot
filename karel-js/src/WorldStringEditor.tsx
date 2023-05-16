import { DefaultButton, ITextFieldStyles, TextField } from "@fluentui/react";
import { useState } from "react";

export default function WorldStringEditor(props: {string: string, cancel: () => void, save: (newVal: string) => void}){

    const codeAreaStyles: Partial<ITextFieldStyles> = {
        field: {
            fontSize: 'larger',
            fontFamily: "'Courier New', Courier, monospace",
            minHeight: "400px"
        }
    }

    const [worldString, setWorldString] = useState<string>(props.string);

    return (
        <div className="WorldStringContainer">
            <div className="WorldStringPopup">
                <h3>Save, edit or replace the world string</h3>
                <TextField styles={codeAreaStyles} multiline defaultValue={props.string} onChange={(_e, newVal) => setWorldString(newVal ?? "")}/>
                <DefaultButton text="Save" onClick={() => props.save(worldString)}/>
                <DefaultButton text="Cancel" onClick={() => props.cancel()}/>
            </div>
        </div>
    )
}