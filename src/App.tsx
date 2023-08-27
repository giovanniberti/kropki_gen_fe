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

    const DIFFICULTY_MAP = {
        "Easy": 15,
        "Medium": 10,
        "Hard": 5
    }

    const [loading, setLoading] = useState(false);
    const [difficulty, setDifficulty] = useState("Easy");

    return (
        <>
            <div style={{display: "flex", flexDirection: "column", justifyContent: "center", alignContent: "center" }}>
                <h1>B.A.R.B.I.E.</h1>
                <h3 style={{ marginTop: "-8px" }}><u>B</u>oard <u>A</u>-sta<u>r</u> <u>B</u>ased <u>I</u>nteractive <u>E</u>xplorer</h3>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "center",
                        alignContent: "center",
                }}>
                    <form
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            gap: "8px",
                            marginBottom: "8px"
                        }}
                        onSubmit={async event => {
                            event.preventDefault();
                            setLoading(true);
                            const response: KropkiSuccessfulResponse = await client.default.postKropki();

                            const ken = response.ken;
                            const kenSolution = response.solution;

                            console.log(ken);
                            if (ken !== undefined) {
                                const constraints = decodeKEN(ken);
                                const solution = decodeKEN(kenSolution);

                                console.log("Decoded constraints:");
                                console.dir(constraints);

                                const redundantConstraints = sample(solution, DIFFICULTY_MAP[difficulty]);
                                console.log("Redundant constraints for difficulty " + difficulty)
                                console.dir(redundantConstraints);

                                setConstraints(constraints.concat(redundantConstraints));
                            }

                            setLoading(false);
                        }}
                    >
                        <select
                            onChange={e =>setDifficulty(e.target.value)}
                        >
                            {Object.entries(DIFFICULTY_MAP).map(([k, v]) => {
                                return <option value={k}>{k} ({v} hints)</option>
                            })}
                        </select>
                        <button type="submit" disabled={loading}>{loading ? "Loading..." : "Generate Kropki"}</button>
                    </form>
                </div>
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

function sample<T>(population: T[], k: number): T[] {
    const result = [];
    const populationSize = population.length;

    const availableIndices = Object.fromEntries(Object.keys(population).map(k => [Number(k), 0]));
    for (let i = 0; i < k; i++) {
        let randomIndex;
        do {
            randomIndex = Math.ceil(Math.random() * populationSize)
        } while(!(randomIndex in availableIndices));

        delete availableIndices[randomIndex];
        result.push(population[randomIndex]);
    }

    return result;
}

export default App
