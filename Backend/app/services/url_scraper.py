import httpx
from bs4 import BeautifulSoup
from app.services.job_parser import parse_job_text

async def scrape_job_from_url(url: str) -> dict:
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        # User agent to avoid some blocks
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        try:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove scripts and styles
            for script_or_style in soup(["script", "style"]): 
                script_or_style.decompose()

            # Extra metadata to help AI identify company/role accurately
            page_title = soup.title.string if soup.title else ""
            h1s = " | ".join([h.get_text().strip() for h in soup.find_all("h1")])
            h2s = " | ".join([h.get_text().strip() for h in soup.find_all("h2")])

            # Extract body text
            body_text = soup.get_text(separator=' ', strip=True)
            
            # Combine them: prioritize title and headers at the start
            combined_text = f"HEADER INFO: {page_title} | {h1s} | {h2s}\n\nBODY TEXT: {body_text[:10000]}"
            
            # Send to parser
            parsed_data = parse_job_text(combined_text)
            
            # Map platform from URL
            if "linkedin.com" in url:
                parsed_data["platform"] = "LinkedIn"
            elif "indeed.com" in url:
                parsed_data["platform"] = "Indeed"
            elif "glassdoor.com" in url:
                parsed_data["platform"] = "Glassdoor"
            else:
                domain = url.split("//")[-1].split("/")[0]
                parsed_data["platform"] = domain if domain else "Unknown"
            
            return parsed_data
            
        except Exception as e:
            return {
                "error": f"Failed to scrape URL: {str(e)}",
                "company": "",
                "role": "",
                "location": "",
                "salary_range": "",
                "platform": "",
                "job_description": f"URL: {url}"
            }
