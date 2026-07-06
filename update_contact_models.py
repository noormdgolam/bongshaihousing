import re

with open(r"e:\web\Bongshaihousing\contact.html", "r", encoding="utf-8") as f:
    template = f.read()

old_select = """                  <select id="model" name="model" class="form-control">
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="LCV-101">Model LCV-101</option>
                    <option value="LCV-102">Model LCV-102</option>
                    <option value="LCV-103">Model LCV-103</option>
                    <option value="LCV-104">Model LCV-104</option>
                    <option value="LCV-105">Model LCV-105</option>
                    <option value="LCV-106">Model LCV-106</option>
                    <option value="LCV-107">Model LCV-107</option>
                    <option value="LCV-108">Model LCV-108</option>
                    <option value="LCV-109">Model LCV-109</option>
                    <option value="Luxury Villa">Luxury Villa</option>
                    <option value="Custom Project">Custom Project</option>
                  </select>"""

new_select = """                  <select id="model" name="model" class="form-control">
                    <option value="General Inquiry">General Inquiry</option>
                    <optgroup label="Duplex Villa Models">
                      <option value="DV-101">Model DV-101</option>
                      <option value="DV-102">Model DV-102</option>
                      <option value="DV-103">Model DV-103</option>
                      <option value="DV-104">Model DV-104</option>
                      <option value="DV-105">Model DV-105</option>
                      <option value="DV-106">Model DV-106</option>
                      <option value="DV-107">Model DV-107</option>
                      <option value="DV-108">Model DV-108</option>
                      <option value="DV-109">Model DV-109</option>
                      <option value="DV-110">Model DV-110</option>
                      <option value="DV-111">Model DV-111</option>
                      <option value="DV-112">Model DV-112</option>
                      <option value="DV-113">Model DV-113</option>
                    </optgroup>
                    <optgroup label="Low-Cost Villa Models">
                      <option value="LCV-101">Model LCV-101</option>
                      <option value="LCV-102">Model LCV-102</option>
                      <option value="LCV-103">Model LCV-103</option>
                      <option value="LCV-104">Model LCV-104</option>
                      <option value="LCV-105">Model LCV-105</option>
                      <option value="LCV-106">Model LCV-106</option>
                      <option value="LCV-107">Model LCV-107</option>
                      <option value="LCV-108">Model LCV-108</option>
                      <option value="LCV-109">Model LCV-109</option>
                    </optgroup>
                    <optgroup label="Other">
                      <option value="Luxury Villa">Luxury Villa</option>
                      <option value="Container House">Container House</option>
                      <option value="Industrial Shed">Industrial Shed</option>
                      <option value="Worker Accommodation">Worker Accommodation</option>
                      <option value="Site Office">Site Office</option>
                      <option value="Security Kiosk">Security Kiosk</option>
                      <option value="Custom Project">Custom Project</option>
                    </optgroup>
                  </select>"""

if old_select in template:
    template = template.replace(old_select, new_select)
    with open(r"e:\web\Bongshaihousing\contact.html", "w", encoding="utf-8") as f:
        f.write(template)
    print("Successfully updated contact.html with all models.")
else:
    print("Warning: Could not find the select block to replace.")
