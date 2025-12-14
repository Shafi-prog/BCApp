import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";

// Import the main App component
import App from "../../src/App";

export class BCApp implements ComponentFramework.ReactControl<IInputs, IOutputs> {
    private notifyOutputChanged!: () => void;
    private context!: ComponentFramework.Context<IInputs>;
    private container!: HTMLDivElement;

    constructor() {}

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary
    ): void {
        this.context = context;
        this.notifyOutputChanged = notifyOutputChanged;
        
        // Store context globally for SharePoint service
        (window as any).__powerAppsContext = context;
    }

    public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
        return React.createElement(App);
    }

    public getOutputs(): IOutputs {
        return {};
    }

    public destroy(): void {
        // Cleanup
    }
}
