import { ITextFieldStyles, TextField } from '@fluentui/react'
import { store } from './Store'

export default function CodeArea(): JSX.Element{

    const codeAreaStyles: Partial<ITextFieldStyles> = {
        field: {
            fontSize: 'larger',
            fontFamily: "'Courier New', Courier, monospace",
            minHeight: "400px"
        }
    }

    return (
        <div className='codeArea'>
            <TextField styles={codeAreaStyles} multiline onChange={(_e, newVal) => store.codeString = newVal ?? ""}></TextField>
        </div>
    )
}