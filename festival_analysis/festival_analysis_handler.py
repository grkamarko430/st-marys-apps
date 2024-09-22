import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import clients.festival_analysis_client as fac

festival_analyzer = fac.FestivalAnalyzer()
festival_analyzer.execute()
