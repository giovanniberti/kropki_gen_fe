import {Constraint} from "../model/Constraints";

interface BoardCellProps {
    id?: string,
    constraints: Constraint[]
}

function renderConstraint(constraint: Constraint) {
    if (constraint.type === "cell") {
        return {
            value: constraint.value
        }
    } else {
        return {
            value: ""
        }
    }
}

export function BoardCell({constraints, id}: BoardCellProps) {
    const firstConstraint = constraints.length > 0 ? constraints[0] : undefined;

    if (firstConstraint !== undefined) {
        console.log("fc: " + JSON.stringify(firstConstraint));
        console.log(renderConstraint(firstConstraint).value)
    }

    return (
        <div id={id}>
            {firstConstraint ? renderConstraint(firstConstraint).value : ""}
        </div>
    );
}
