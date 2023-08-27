import './App.css'
import {Board} from "./components/Board";
import {CellConstraint, DotConstraint, DotType} from "./model/Constraints";
import {useState} from "react";
import { decodeKEN } from './model/ken';
import {AppClient, KropkiSuccessfulResponse} from "../generated";

function App() {
    const [constraints, setConstraints] = useState([
        new CellConstraint([1, 1], 4),
        new DotConstraint([[1, 1], [1, 2]], DotType.BLACK),
        new DotConstraint([[1, 1], [2, 1]], DotType.WHITE)
    ]);

    const client = new AppClient({
        BASE: 'http://localhost:8000',
    });

    const [loading, setLoading] = useState(false);

    return (
        <>
            <div style={{display: "flex", flexDirection: "column", justifyContent: "center", alignContent: "center" }}>
                <h1>B.A.R.B.I.E.</h1>
                <h3 style={{ marginTop: "-8px" }}><u>B</u>oard <u>A</u>-sta<u>r</u> <u>B</u>ased <u>I</u>nteractive <u>E</u>xplorer</h3>
                <form
                    style={{ marginBottom: "8px" }}
                    onSubmit={async event => {
                        event.preventDefault();
                        setLoading(true);
                        const response: KropkiSuccessfulResponse = await client.default.postKropki();

                        const ken = response.ken;

                        console.log(ken);
                        if (ken !== undefined) {
                            const constraints = decodeKEN(ken);
                            console.log("Decoded constraints:");
                            console.dir(constraints);
                            setConstraints(constraints);
                        }

                        setLoading(false);
                    }}
                >
                    <button type="submit" disabled={loading}>{loading ? "Loading..." : "Generate Kropki"}</button>
                </form>
                <div style={{
                    display: "flex",
                    justifyContent: "center"
                }}>
                    <Board constraints={constraints}/>
                </div>
                <span style={{ marginTop: "32px" }} />
                <form
                    onSubmit={event => {
                        event.preventDefault();
                        const data = new FormData(event.target as HTMLFormElement);
                        const ken = data.get('ken')?.toString();

                        console.log(ken);
                        if (ken !== undefined) {
                            const constraints = decodeKEN(ken);
                            console.log("Decoded constraints:");
                            console.dir(constraints);
                            setConstraints(constraints);
                        }
                    }}
                >
                    <input
                        type="text"
                        name="ken"
                        style={{
                            width: "50%",
                            marginLeft: "auto",
                            marginRight: "auto"
                        }}
                        placeholder="Type KEN..."
                    />
                </form>
            </div>
        </>
    )
}

export default App
