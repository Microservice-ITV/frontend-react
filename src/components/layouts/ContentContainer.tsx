type Props = {
    children: React.ReactNode
}

const ContentContainer = ({ children }: Props) => {
    return <div className="mx-auto max-w-[1200px] px-4 sm:px-6">{children}</div>
}

export default ContentContainer