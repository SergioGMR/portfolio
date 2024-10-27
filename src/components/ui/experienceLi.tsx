import { useEffect, useState } from 'react'
import { EXPERIENCE } from '@/lib/constants'

type ExperienceKey = keyof typeof EXPERIENCE;

export function ExperienceLi(slice?: boolean) {
    const [language, setLanguage] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('language') || 'es';
        }
        return 'es';
    });
    const [experience, setExperience] = useState<any>([]);
    const updateExperience = () => {
        language
        setExperience(EXPERIENCE[language as ExperienceKey]);
    }

    useEffect(() => {
        updateExperience();
        console.log(experience)
    }, [language]);

    if (typeof window !== 'undefined') {
        window.addEventListener('languageChange', () => {
            updateExperience()
        })
        updateExperience()
    }

    return (
        <>
            {!slice && (
                <ul>
                    {
                        experience.map((entry: any) => (
                            <li className="animate mt-4 border-b border-black/10 py-8 first-of-type:mt-0 first-of-type:pt-0 last-of-type:border-none dark:border-white/25" key={entry.start}>
                                <div className="mb-4 text-sm uppercase">
                                    {entry.start} - {entry.end}
                                </div>
                                <a
                                    href={entry.link ?? ''}
                                    className={`font-semibold ${entry?.link ? 'text-primary' : 'text-foreground'}`}
                                >
                                    {entry.company}
                                </a>
                                <div className="text-sm font-semibold">{entry.position}</div>
                                <article className="prose dark:prose-invert">
                                    {entry.tasks.map((i: any) => (
                                        <span key={i}>{i}</span>
                                    ))}
                                </article>
                            </li>
                        ))
                    }
                </ul>
            )}
            {experience.slice(0, 3).map((entry: any) => (
                <div>
                    <h3 className="text-lg font-semibold">{entry.position}</h3>
                    <a className="text-sm text-primary" href={entry?.link ?? ''}>
                        {entry.company}
                    </a>
                    <p className="text-sm text-gray-600">
                        {entry.start} - {entry.end}
                    </p>
                </div>
            ))}
        </>
    )
}
