import { KarelType } from "./Store";

export default function Karel(): KarelType{
    return {
        facing: "North",
        row: 0,
        column: 0,
        beepers: 0
    }
}