import './App.css'
import {Board} from "./components/Board";
import {CellConstraint, DotConstraint, DotType} from "./model/Constraints";
import {useState} from "react";
import { decodeKEN } from './model/ken';

function App() {
    const [constraints, setConstraints] = useState([
        new CellConstraint([1, 1], 4),
        new DotConstraint([[1, 1], [1, 2]], DotType.BLACK),
        new DotConstraint([[1, 1], [2, 1]], DotType.WHITE)
    ]);

    return (
        <>
            <div style={{display: "flex", flexDirection: "column", justifyContent: "center", alignContent: "center" }}>
                <h1>B.A.R.B.I.E.</h1>
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
