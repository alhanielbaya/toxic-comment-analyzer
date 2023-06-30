import { useEffect, useState } from "react";
import axios from "axios";
import PredictionResults from "../interfaces/PredictionResults";
import './CommentForm.css';
import LifetimeStats from "../interfaces/LifeTimeStats";

export const CommentForm = () => {
    const [comment, setComment] = useState<string>('');
    const [result, setResult] = useState<PredictionResults | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [displayedComment, setDisplayedComment] = useState<string>('');
    const [lifetimeStats, setLifetimeStats] = useState<LifetimeStats | null>(null);

    const toxicComments = [
        "You look stupid!",
        "You're an absolute failure. It's clear that you have no idea what you're talking about. Why don't you just keep your mouth shut?",
        "Your posts are always a waste of everyone's time. Your ignorance is astonishing and endlessly irritating.",
        "Stop pretending to be intelligent. It's pathetic and downright embarrassing. You're a total joke.",
        "The amount of nonsense you spout is simply staggering. You're an utter disgrace and a complete waste of space."
    ];
    const nonToxicComments = [
        "Your insight is always so valuable. Thanks for sharing your perspective - it's incredibly thought-provoking.",
        "You consistently bring a level of intelligence and thoughtfulness to the discussion that is greatly appreciated.",
        "Your ability to articulate complex ideas so clearly is truly impressive. You are a valuable contributor to this community.",
        "I always learn something new from your posts. Your knowledge and experience are evident, and your willingness to share is commendable.",
        "Thank you for your constructive feedback. It's clear that you put a lot of thought into your response, and I appreciate your time and effort."
    ];

    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setComment(e.target.value);
    }

    const handleRandomComment = () => {
        const toxic = Math.random() >= 0.5; // Choose randomly if the comment should be toxic or not
        const comments = toxic ? toxicComments : nonToxicComments;
        const randomComment = comments[Math.floor(Math.random() * comments.length)]; // Choose a random comment from the appropriate list
        setComment(randomComment);
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        // Prevent the page from refreshing
        e.preventDefault();
        // CHeck if the comment is empty
        if (comment.trim() === '') {
            setError('Comment cannot be empty.');
            return;
        }


        // Make a POST request to the Flask server
        try {
            const response = await axios.post('https://al-haniel-server.de/predict', {
                comment: comment,
            });

            const labels = ['identity_hate', 'insult', 'obscene', 'severe_toxic', 'threat', 'toxic'];
            // Add the specified labels up to get the total toxicity score
            const totalScore = labels.reduce((sum: number, label: string) => sum + response.data[label], 0);

            setResult({ ...response.data, totalScore });
            setError(null);
            setDisplayedComment(comment);

        } catch (error: any) {
            if (error.response) {
                setError(error.response.data.error);
            } else if (error.request) {
                setError("No response from the server.");
            } else {
                setError("Something went wrong.");
            }
        }
    }

    const getToxicityLevel = (): string => {
        const score = result?.totalScore;
        if (score === 0) return 'Not toxic';
        if (score === 1) return 'Somewhat toxic';
        if (score === 2) return 'Mildly toxic';
        if (score === 3) return 'Moderately toxic';
        if (score === 4) return 'Very toxic';
        return 'Extremely toxic';
    }

    // Initialize result to not toxic
    useEffect(() => {
        setResult({ identity_hate: 0, insult: 0, obscene: 0, severe_toxic: 0, threat: 0, toxic:0, totalScore: 0, toxicity_score: 0 });
    }, []);

    // Fetch lifetime stats
    useEffect(() => {
        const fetchLifetimeStats = async () => {
            try {
                const response = await axios.get('https://al-haniel-server.de/lifetime-statistics');
                setLifetimeStats(response.data);
            } catch (error) {
                console.error('Failed to fetch lifetime stats:', error);
            }
        };

        fetchLifetimeStats();
    }, [displayedComment]);

    return (
        <>
            <div className="comment-form">
                <form onSubmit={handleSubmit} className="comment-form__form">
                    <textarea
                        onChange={handleCommentChange}
                        value={comment}
                        className="comment-form__textarea"
                        maxLength={500}
                    ></textarea>
                    <button type="submit" className="comment-form__button">Post Comment</button>
                </form>

                <button onClick={handleRandomComment} className="comment-form__button">Generate Random Comment</button>

                {error && <p className="comment-form__error">Error: {error}</p>}
            </div>
            <div className="comment-stats">
                <h2 className="comment-stats__title">Comment Analysis</h2>

                <div>

                    <p className="comment-stats__comment-head">Comment Text: </p>
                    <p className="comment-stats__comment">{displayedComment}</p>


                    <p className="comment-stats__level">Toxicity Level: {result ? getToxicityLevel() : ''}</p>
                </div>
                {result && (
                    <div className="comment-stats__labels">
                        <p>Labels:</p>
                        <ul>
                            <li>
                                <input type="checkbox" className=" " checked={result.identity_hate > 0} disabled />
                                <label>Identity Hate</label>
                            </li>
                            <li>
                                <input type="checkbox" checked={result.insult > 0} disabled />
                                <label>Insult</label>
                            </li>
                            <li>
                                <input type="checkbox" checked={result.obscene > 0} disabled />
                                <label>Obscene</label>
                            </li>
                            <li>
                                <input type="checkbox" checked={result.severe_toxic > 0} disabled />
                                <label>Severely Toxic</label>
                            </li>
                            <li>
                                <input type="checkbox" checked={result.threat > 0} disabled />
                                <label>Threat</label>
                            </li>
                            <li>
                                <input type="checkbox" checked={result.toxic > 0} disabled />
                                <label>Toxic</label>
                            </li>
                        </ul>
                    </div>
                )}

            </div>

            {lifetimeStats && (
                <div className="comment-lifetime-stats">
                    <h2 className="comment-lifetime-stats__title">Lifetime Stats</h2>
                    <h4 className="comment-lifetime-stats__sub-title">used by this site</h4>

                    <p>Total Comments Analyzed: <b>{lifetimeStats.total_comments}</b></p>
                    <p>Toxic Comments: <b>{lifetimeStats.toxic_comments}</b></p>

                    <h3>Total of labeled comments:</h3>
                    <ul>
                        <li>Identity Hate: {lifetimeStats.identity_hate}</li>
                        <li>Insult: {lifetimeStats.insult}</li>
                        <li>Obscene: {lifetimeStats.obscene}</li>
                        <li>Severely Toxic: {lifetimeStats.severe_toxic}</li>
                        <li>Threat: {lifetimeStats.threat}</li>
                        <li>Toxic: {lifetimeStats.toxic}</li>
                    </ul>
                </div>
            )}
        </>
    )
}
