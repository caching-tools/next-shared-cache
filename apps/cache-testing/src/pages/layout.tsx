import { RestartButton } from '../components/restart-button';
import { RevalidateButton } from '../components/revalidate-button';
import '../globals.css';

export default function Layout({ children }): JSX.Element {
    return (
        <main>
            {children}
            <RevalidateButton nextApi="pages" type="path" />
            <RestartButton />
        </main>
    );
}
