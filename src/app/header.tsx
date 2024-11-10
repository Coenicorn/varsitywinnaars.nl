export default function Header() {
    return (
        <header class="m-4">
            <nav className="mx-auto flex max-w-6xl items-center justify-between p-6 lg:px-8">
                <a href="/sources" class="">
                    <span>bronnen</span>
                </a>
                <a href="/contribute">
                    <span>bijdragen</span>
                </a>
            </nav>
        </header>
    );
}