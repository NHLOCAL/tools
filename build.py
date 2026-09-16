"""Build the public website from the repository catalog."""

from site_builder.catalog import classify_tool_section
from site_builder.pages import build_site
from site_builder.render import generate_tool_html
from site_builder.seo import write_seo
from site_builder.downloads import write_download_payloads


def main():
    tools, pages = build_site()
    write_seo(tools, pages)
    write_download_payloads(tools)
    print(f"Built {len(pages)} static pages for {len(tools)} tools")


if __name__ == "__main__":
    main()
