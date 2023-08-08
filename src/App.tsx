import './App.css'
import {Board} from "./components/Board";
import {CellConstraint, DotConstraint, DotType} from "./model/Constraints";
import {useState} from "react";

function App() {
    const [constraints, setConstraints] = useState([
        new CellConstraint([1, 1], 4),
        new DotConstraint([[1, 1], [1, 2]], DotType.BLACK)
    ]);

    return (
        <>
            <div style={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
                <h1>B.A.R.B.I.E.</h1>
                <div style={{
                    display: "flex",
                    justifyContent: "center"
                }}>
                    <Board constraints={constraints}/>
                </div>
            </div>
        </>
    )
}

export default App
