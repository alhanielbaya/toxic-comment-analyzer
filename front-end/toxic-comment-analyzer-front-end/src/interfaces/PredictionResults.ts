interface PredictionResults {
    identity_hate: number;
    insult: number;
    obscene: number;
    severe_toxic: number;
    threat: number;
    toxic: number;
    toxicity_score: number;
    totalScore?: number; // this is an optional property
    [key: string]: number | undefined;
}


export default PredictionResults;